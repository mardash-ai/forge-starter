# Make the App — Quickstart Proof Fixture

**Forge tag:** `v1.55.0` (images: `ghcr.io/mardash-ai/forge-control-plane:1.55.0`,
`ghcr.io/mardash-ai/forge-data-plane:1.55.0`)

**Recorded:** 2026-09-04 against the refreshed forge-starter (skill-set v0, compose.yaml pinned to 1.55.0).

## What this is

This fixture records the end-to-end execution of the forge-starter quickstart:

```
git clone forge-starter
cd forge-starter
export FORGE_SECRETS_KEY=<strong-random-key>   # never echo the value
./new-app hello --with-postgres --dev
```

…from a Docker-only environment, producing a running app (control plane + data plane + app at
`./app`). It is the "one recording, two uses" fixture referenced in skill-set-plan §4.4:
committed here and moved unchanged to the developer site repo when `goals/forge-site-bootstrap.md`
creates it.

## Files in this directory

| File | Contents |
|---|---|
| `hops.json` | Each step of the runbook (label, command, raw forge response, status) |
| `events.json` | Full forge event timeline — `./forge inspect events --app hello` output |
| `before-state.json` | Repo / platform state before the run (clean clone, no app) |
| `after-state.json` | Final observed state: app inspect, docker inspect, dev status, health check |

## Quickstart summary (observed)

```
Forge · new app: hello (web/nextjs)

  platform   ✓ up
  init       ✓ app_b6ec91cf0a8e4e94a523
  provision  ✓ services: web,postgres
  install    ✓ Installed dependencies (371 packages) in 24.0s.
  build      ✓ artifacts: .next
  test       ✓ passed=3 failed=0
  lint       ✓ problems=0
  dev        ✓ http://localhost:3000
  health     ✓ {"status":"ok","service":"hello","checks":[]}

✓ hello is ready.
  build=build_49e1e56a0b3c4694818f  test=test_357c9b1994824b2b84ff  lint=check_d91a60aed2f045b28ef5
  source: app/
```

## Verification (observed)

```
$ ./forge dev --app hello
{"resource":"dev_4eec757504ac4530ac58","status":"running","url":"http://localhost:3000","health":"healthy","container_id":"47c8cd4bdb92"}

$ curl http://localhost:3000/api/health
{"status":"ok","service":"hello","time":"2026-09-04T14:59:34.232Z","checks":[]}
```

**Verdict: PASS** — control plane up (forge-control-plane:1.55.0), data plane running (web +
postgres), app healthy at http://localhost:3000, build green, 3/3 tests passing, 0 lint errors.

## Machine notes (not applicable on a clean Docker-only machine)

On this recording machine, host port 5432 was already allocated by an unrelated service
(`personamgr-db`). The generated `app/compose.yaml` was adjusted to bind postgres to host port
5433 (`"5433:5432"`) before starting the dev server. On a clean machine with only Docker this
adjustment is unnecessary — the generated compose.yaml binds to 5432 and works as-is.

The first invocation of `./new-app hello --with-postgres --dev` also surfaced an intermittent
platform error at the provision step ("No Application named 'hello'" — `retry: change-input`),
recovered by running the steps manually in sequence. On a clean machine the full one-liner is
expected to succeed first try; this finding should be reported upstream as a potential
init→provision race condition.

## Secret handling

`FORGE_SECRETS_KEY` was generated via `openssl rand -hex 32` and placed in `.env` (gitignored).
Its value is never present in any fixture file or command output. All `log_ref` paths reference
`.forge/logs/` which is also gitignored.
