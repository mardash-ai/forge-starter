# Deploying your Forge app

Your app runs in production as a **Next.js standalone container** behind a shared **Traefik** reverse
proxy, optionally with a **Forge data-plane sidecar** (scheduler + secrets) and **Postgres**. It's
deployed with **zero downtime** by the Forge **`Deploy` capability** — `make deploy` → `forge deploy`
rolls the public `web` service *start-first* (a new replica comes up and passes health before the old
one drains out of the proxy), so the site never loses its backend.

> **You don't build on the host.** CI builds + publishes the image; the deploy host just pulls and
> runs it. Zero-downtime is a **platform capability**, not a script in this repo — there is no
> `rollout.sh` to maintain.

## 1. Productionize the app (once)

**Forge generates your production artifacts — you don't hand-stage them.** Once `./app` exists, run
the **`Productionize` capability**:

```bash
./forge productionize --app <app> --host <your-domain> \
  --web-image ghcr.io/<owner>/<repo>@sha256:<digest> \
  [--data-plane-image ghcr.io/mardash-ai/forge-data-plane@sha256:<digest>] \
  [--readiness-path /api/health]
```

It emits — **digest-pinned** and **convergent** (safe to re-run: it reconciles from the app's
persisted `infra` + `--host`, so nothing you didn't ask for is dropped):

- `app/Dockerfile` + `app/.dockerignore` — the Next.js **standalone** image build.
- `output: 'standalone'` in `app/next.config.mjs`.
- `compose.prod.yaml` — Traefik-fronted `web` (health-gated) + data-plane + Postgres, all pinned by digest.
- `.env.prod.example` — the env template you copy to `app/.env.prod` in step 2.

- **Readiness path** *(you choose)* — the deploy roll gates on `--readiness-path` (default
  `GET /api/health` returning `200`). `./new-app` scaffolds a matching route; keep it cheap (no
  external calls).
- **Host rule** *(you choose)* — `--host` is the public hostname Traefik routes to this app.

Commit the generated files. Pushing to `main` triggers [`ci.yml`](.github/workflows/ci.yml)
(test + build) and [`publish-app.yml`](.github/workflows/publish-app.yml) (publishes
`ghcr.io/<owner>/<repo>` multi-arch — the image you pass back as `--web-image`). When that published
digest changes, **re-run `forge productionize`** to repin `compose.prod.yaml` / `.env.prod.example`;
it's convergent, so it just updates the pin.

## 2. Configure (once per deploy host)

```bash
cp .env.prod.example app/.env.prod && chmod 600 app/.env.prod
```
`forge productionize` already pinned the image digests (`APP_IMAGE`, `FORGE_DATA_PLANE_IMAGE`,
`FORGE_IMAGE`) into the generated `.env.prod.example`, so just set `APP_NAME`, `APP_HOST`, `DB_NAME`,
`POSTGRES_PASSWORD`, and any secrets. You edit **only `app/.env.prod`** — a plain `forge deploy`
loads it (its `--env-file` defaults to `app/.env.prod`), so `compose.prod.yaml` reads everything from
it. To repin later, **re-run `forge productionize`** (convergent) rather than hand-editing digests.

Prereqs on the host: **Docker**, a running **Traefik** stack that owns the external `proxy` network
(or `up` fails *"network proxy not found"*), DNS for `APP_HOST` pointing at the host, and
`docker login ghcr.io` if your images are private.

## 3. Deploy

```bash
make deploy
```

`make deploy` starts the Forge **control plane** transiently (`make up`) and runs
**`./forge deploy --app <app> --proxy-net proxy`** — its `--env-file` defaults to `app/.env.prod`
(the file you wrote in step 2), so no flag is needed. It:

1. reconciles `postgres` / `data-plane` in place;
2. brings up a **second `web`** on the new image alongside the old (Traefik health-gates it via the
   `loadbalancer.healthcheck` labels, so it only takes traffic once `/api/health` passes);
3. waits until it's healthy, then drains the old out of `proxy` and removes it.

There is always ≥1 healthy backend → **no 502s**. A new replica that never gets healthy is discarded
and the old keeps serving (automatic rollback → a `DeploymentRolledBack` fact). Each deploy is a
`Deployment` resource — inspect it with `./forge inspect events`.

> **Verify zero downtime:** probe the public URL *during* a deploy —
> `while :; do curl -sf -o /dev/null https://$APP_HOST/api/health && printf . || printf X; sleep 0.2; done`
> — every mark should be a `.`.

| Command | What it does |
|---|---|
| `make deploy` | start control plane → `forge deploy` (reconcile deps → zero-downtime roll of `web`) |
| `make deploy-ps` | container status |
| `make deploy-logs` | tail all logs |
| `make deploy-config` | validate `compose.prod.yaml` + `app/.env.prod` (no changes) |
| `make deploy-down` | stop the stack, **keep** the data volumes |

## Deploying to a remote host

`make deploy` deploys to **this machine's** Docker daemon. To deploy from your laptop to a remote
box, either run `make deploy` **on the box** (SSH in — see the note below), or point `forge deploy`
at a remote daemon with a Docker context:

```bash
docker context create prod --docker "host=ssh://user@your-box"
./forge deploy --app <app> --context prod        # rolls the remote stack
```

> **Remote note:** a `--context` deploy reads `compose.prod.yaml` + `app/.env.prod` locally but runs on the
> remote daemon, so host **bind-mounts** (e.g. `deploy/jobs.json`) must exist at the same path on the
> box — or drop them / use named volumes. Named volumes (`postgres_data`, `forge_state`) live on the
> remote and persist across deploys. For a laptop-driven, SSH-key deploy convenience wrapper, add
> your own `release/` scripts (gitignored — see `.gitignore`).

## Notes that bite in real prod

- **Traefik ingress, no host port.** `web` joins `proxy`; Traefik routes `APP_HOST` → the container
  (`loadbalancer.server.port=3000`). The image sets `ENV HOSTNAME=0.0.0.0` (else 502) and ships `public/`.
- **`FORGE_SECRETS_KEY` must be stable + durable** — it decrypts the data-plane's secret vault (in
  the `forge_state` volume). Change it and stored secrets become unreadable.
- **Data lives in named volumes** (`postgres_data`, `forge_state`). `make deploy-down` keeps them;
  never `down -v` in prod.
- **Scheduled jobs.** The data-plane registers jobs from [`deploy/jobs.json`](deploy/jobs.json) at
  boot and calls `http://web:3000<target>` on cadence. Ships empty; add entries once the app exposes
  the matching cron endpoints (see [`deploy/jobs.example.json`](deploy/jobs.example.json)).
- **No app? No prod images.** CI + `make deploy` only do something once `app/` exists and
  `forge productionize` has generated its `app/Dockerfile`.
