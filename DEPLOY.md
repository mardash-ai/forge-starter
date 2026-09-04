# Deploying your Forge app

Your app runs in production as a **Next.js standalone container** behind a shared **Traefik** reverse
proxy, alongside a **Forge data-plane sidecar** (scheduler + secrets + server sessions) and, when it
has its own database, **Postgres**. It deploys with **zero downtime** via the Forge platform:
`forge release` (which runs `forge deploy` under the hood) rolls the public `web` service _start-first_
— a new replica comes up and passes health before the old one drains out of the proxy — so the site
never loses its backend.

> **You don't build on the host, and you don't hand-write the prod stack.** `forge productionize`
> **generates** the production artifacts (Dockerfile + `app/compose.prod.yaml` + env template);
> `forge release` publishes the image, repins, deploys, and verifies. Zero-downtime is a **platform
> capability**, not a script in this repo — there is no `rollout.sh` to maintain.

## Layout (single-app)

The Forge **control plane** runs at the repo **root** (`compose.yaml`, `FORGE_APP_LAYOUT=single`); your
app lives under **`app/`**. The production stack is generated **into `app/`** (`app/compose.prod.yaml` +
`app/.env.prod`) and resolved leniently from `app/forge.app.json`. There is no root-level prod compose
file — it is superseded by the generated `app/compose.prod.yaml`.

## 1. Provision (once)

With the control plane up (`make up`), provision the app's platform infrastructure:

```bash
./forge provision --app <APP> --platform-store postgres --secret AUTH_SESSION_SECRET
```

- `--platform-store postgres` gives the platform its own `forge_platform` Postgres database (for the
  data-plane's state: scheduler, secrets, sessions), separate from any app database.
- `--secret AUTH_SESSION_SECRET` declares the session-signing secret used by sign-in (**C10**) and
  server-side sessions (**C23**).
- Add **`--with-postgres`** if the app has its **own** application database (a second Postgres for your
  app's data).

`make provision` wraps this exact command.

## 2. Productionize (generates the prod stack)

```bash
./forge productionize --app <APP> --host <DOMAIN>
```

It emits — **digest-pinned** and **convergent** (safe to re-run: it reconciles from the app's persisted
`infra` + `--host`, so nothing you didn't ask for is dropped):

- `app/Dockerfile` + `app/.dockerignore` — the Next.js **standalone** image build; `output: 'standalone'`
  in `app/next.config.mjs`.
- **`app/compose.prod.yaml`** — the production stack: a Traefik-fronted, health-gated `web`; a **DB-aware**
  Forge data-plane sidecar wired with **`FORGE_DB_URL`**; Postgres when the app has a database — all pinned
  by digest. The compose **project name is `forge-<APP>-prod`**, which namespaces every container, network,
  and volume (see _Multi-app isolation_ below). Traefik routes **`Host(<DOMAIN>)`**.
- **`app/.env.prod.example`** — the **annotated** env template (each secret prefixed with what it is, which
  capability needs it, required/optional, how to obtain it, and a generate command).
- **`app/PROVISIONING.md`** — a generated **operator runbook** for _this_ app: exactly which secrets to set
  and the `forge secrets set …` commands, plus an **"Enabling a working sign-in method"** section (Google
  redirect URI + Google-vs-SMTP) when the app declares auth. This is the source of truth for provisioning
  — it can't drift from the app the way a hand-kept list would.

`make productionize` wraps this. Commit the generated files. (When your published app image digest later
changes, `forge release` repins automatically; you can also re-run `forge productionize` — it's convergent.)

## 3. Configure secrets (once per deploy host)

```bash
cp app/.env.prod.example app/.env.prod && chmod 600 app/.env.prod
```

**Read [`app/PROVISIONING.md`](app/PROVISIONING.md) — the generated runbook — for exactly which values
this app needs and how to obtain each.** You edit **only `app/.env.prod`** (gitignored); `forge release`
loads it by default. The stable secret set for the deploy toolchain is:

| Secret                       | What it is                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FORGE_SECRETS_KEY`          | Master key for the platform/data-plane encrypted secret store — strong + **stable** (changing it makes stored secrets unreadable).               |
| `FORGE_PLATFORM_DB_PASSWORD` | Password for the separate `forge_platform` Postgres DB owned by `--platform-store=postgres`.                                                     |
| `AUTH_SESSION_SECRET`        | Session-signing secret for sign-in (**C10**) **and** server-side sessions (**C23**). Keep it **stable** — rotating it invalidates live sessions. |
| `POSTGRES_PASSWORD`          | Only if provisioned `--with-postgres` (the app's own application DB).                                                                            |
| Google / SMTP (optional)     | Configure **one** working sign-in method — or none. See `app/PROVISIONING.md`.                                                                   |

> **C23 (server sessions) adds no new secret** — it reuses `AUTH_SESSION_SECRET`.

Generate the random secrets with `openssl rand -hex 32`.

Prereqs on the host: **Docker**, a running **Traefik** stack that owns the external `proxy` network (or
`up` fails _"network proxy not found"_), DNS for `<DOMAIN>` pointing at the host, and `docker login
ghcr.io` if your images are private.

## 4. Release (deploy)

```bash
make release        # ./forge release --app <APP> --host <DOMAIN>
```

`forge release` runs the full pipeline and is **idempotent** — re-run it as often as you like:

1. **assess** — what would change vs. what's running;
2. **publish** — build + push the app image (multi-arch);
3. **repin** — update the digest pins in `app/compose.prod.yaml` / `app/.env.prod`;
4. **deploy** — the zero-downtime start-first roll (a second `web` comes up on the new image, Traefik
   health-gates it via `/api/health`, then the old one drains out of `proxy` and is removed);
5. **verify** — the post-deploy smoke check (below).

There is always ≥1 healthy backend → **no 502s**. A replica that never gets healthy is discarded and the
old keeps serving (automatic rollback → a `DeploymentRolledBack` fact). Each deploy is a `Deployment`
resource — inspect it with `./forge inspect events`.

> **Drift-gated (P14).** `forge deploy` fails loudly if a running container's image doesn't match the
> digest pinned in `app/compose.prod.yaml`/`app/.env.prod`, and **force-recreates** on a pin change — so a
> deploy can't silently keep serving a stale image.

> **Verify zero downtime:** probe the public URL _during_ a release —
> `while :; do curl -sf -o /dev/null https://<DOMAIN>/api/health && printf . || printf X; sleep 0.2; done`
> — every mark should be a `.`.

| Command                        | What it does                                                             |
| ------------------------------ | ------------------------------------------------------------------------ |
| `make release` / `make deploy` | `forge release` (assess → publish → repin → zero-downtime roll → verify) |
| `make deploy-ps`               | container status (`app/compose.prod.yaml`)                               |
| `make deploy-logs`             | tail all prod logs                                                       |
| `make deploy-down`             | stop the stack, **keep** the data volumes                                |

## 5. Verify a live deploy (`forge verify`)

`forge release` verifies automatically; you can also run it standalone against the live host — a good CI
gate to fail a release that came up wrong:

```bash
./forge verify --app <APP> --host <DOMAIN>
```

It asserts the running app honours the platform contracts (the `/api/health` **C6** health shape and, if
the app declares auth, the **C10** `/auth/*` surface) and **exits non-zero** on any violation.

## Multi-app isolation (many apps, one host)

`forge productionize` names the prod compose project **`forge-<APP>-prod`**, which namespaces the
containers, the `internal` network, and the named volumes (`postgres_data`, `forge_state`). So two apps
deployed to the same host with **unique `<APP>` and `<DOMAIN>`** share **nothing** — the only shared thing
is the **external `proxy` Traefik network** they both attach to for ingress. Deploy as many as the box
holds; each is independent.

> **Never `docker compose down -v` in prod** — that destroys the named data volumes (the database and the
> secret vault). `make deploy-down` stops the stack and **keeps** them.

## What your app gets for free (platform-served)

Served by the Forge platform for every productionized app — you don't build or maintain any of them:

- **Public status page (C15).** The platform serves a Statuspage-style **`/status`** (HTML) and
  **`/status.json`** for your host. Opt into **uptime history** (a background sampler + a per-day timeline)
  with **`FORGE_STATUS_SAMPLE=1`** in `app/.env.prod`.
- **App theming (C16).** Drop a **`forge.theme.json`** at the app root to brand **all** platform-served UI
  — the sign-in pages _and_ the status page — via `--forge-*` CSS tokens. No theme file → neutral defaults.

## Scheduled jobs

The data-plane runs scheduled jobs declared in **`app/forge.jobs.json`** — a JSON array in the app dir —
calling `http://web:3000<target_path>` on cadence. Create it alongside the app once it exposes the matching
cron endpoints. Example:

```json
[
  {
    "name": "reminders",
    "every": "15m",
    "target_path": "/api/cron/reminders",
    "method": "POST"
  },
  {
    "name": "nightly-finalize",
    "cron": "5 0 * * *",
    "target_path": "/api/cron/nightly-finalize",
    "method": "POST"
  }
]
```

## Deploying to a remote host

`make release` deploys to **this machine's** Docker daemon. To deploy from your laptop to a remote box,
either run it **on the box** (SSH in), or point Forge at a remote daemon with a Docker context:

```bash
docker context create prod --docker "host=ssh://user@your-box"
./forge release --app <APP> --host <DOMAIN> --context prod
```

> **Remote note:** a `--context` deploy reads `app/compose.prod.yaml` + `app/.env.prod` locally but runs
> on the remote daemon, so any host **bind-mounts** must exist at the same path on the box (or drop them /
> use named volumes). Named volumes (`postgres_data`, `forge_state`) live on the remote and persist across
> deploys. For a laptop-driven, SSH-key deploy convenience wrapper, add your own `release/` scripts
> (gitignored — see `.gitignore`).

## Notes that bite in real prod

- **Traefik ingress, no host port.** `web` joins `proxy`; Traefik routes `<DOMAIN>` → the container
  (`loadbalancer.server.port=3000`). The image sets `ENV HOSTNAME=0.0.0.0` (else 502) and ships `public/`.
- **`FORGE_SECRETS_KEY` must be stable + durable** — it decrypts the data-plane's secret vault (in the
  `forge_state` volume). Change it and stored secrets become unreadable.
- **Data lives in named volumes** (`postgres_data`, `forge_state`). `make deploy-down` keeps them; never
  `down -v` in prod.
- **No app? No prod stack.** CI + `forge release` only do something once `app/` exists and
  `forge productionize` has generated `app/Dockerfile` + `app/compose.prod.yaml`.
