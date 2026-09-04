# Changelog

All notable changes to **forge-starter** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
  New apps cloned from forge-starter: keep this format.
  - Accrue work under ## [Unreleased]; at release time MOVE it into a new
    ## [X.Y.Z] — YYYY-MM-DD section. The separator is an EM DASH "—" (U+2014), not a hyphen.
  - Sections in order: ### Added, ### Changed, ### Fixed. Lead bullets are bold-scope-prefixed
    and end with a period; sub-bullets indent 2 spaces. Inline code in backticks; no commit hashes/URLs.
  - Version source of truth is app/package.json "version" (present in every clone). In the bare
    template repo (no ./app yet) the version lives in this CHANGELOG's latest heading + git tags.
    SemVer: feature => MINOR, fix => PATCH, breaking => MAJOR. `/commit-code` bumps the version and
    adds the matching dated entry.
  - Keep the footer compare links (newest first) in sync with the GitHub remote.
-->

## [Unreleased]

## [0.2.0] - 2026-09-04

### Changed

- **Bump the Forge control-plane and data-plane images to `1.55.0`.** `compose.yaml` now pins
  `ghcr.io/mardash-ai/forge-control-plane:1.55.0` and passes
  `FORGE_DATA_PLANE_IMAGE=ghcr.io/mardash-ai/forge-data-plane:1.55.0`, replacing `0.35.0`.
  No residual `0.35.0` reference remains in the repo.

### Fixed

- **`compose.yaml` `FORGE_SECRETS_KEY` interpolation no longer hard-errors on `docker compose config`.** Replaced
  `${FORGE_SECRETS_KEY:?…}` with `${FORGE_SECRETS_KEY:-}` so `docker compose config -q` passes in a
  clean checkout without a `.env`. The control plane still refuses to start without a real key at runtime;
  `.env.example` comment updated to match.

### Added

- **ForgeError retry rule added to all three bundled skills and CLAUDE.md (skill-set v0).**
  `provision-app`, `add-a-feature`, and `frontend-design` SKILL.md files each now document the
  platform error handling contract: on `{"error":{...}}`, read `.error.retry` —
  `change-input` → fix and retry; `needs-human` → stop and ask; `retry` → retry;
  `no` → report the resource id and stop. CLAUDE.md carries the same one-liner in its
  granular-capabilities section for quick reference.
- **Stale `< 0.3.0` provision warnings removed from `provision-app`.** The "destructive
  provision on older control planes" callout and the related Known failure signatures rows are
  gone; provision has converged from persisted infra since 0.3.0 and the current control plane
  is 1.55.0. The step-gate `no` retry case is added.
- **README.md and specs/ADD\_A\_FEATURE.md updated in lockstep.** Both files now document the
  platform error `{"error":{...}}` / `.error.retry` handling and reflect the refreshed CLI,
  flags, and one-line JSON contract.

### Fixed

- **`fixtures/make-the-app/after-state.json` — re-verified live state and added cleanup note.**
  Re-ran `./forge inspect app/docker/routes`, `./forge dev`, and `curl /api/health` against the
  running hello app; updated resource IDs and timestamps to the observed values. Added
  `cleanup_note` documenting that the demo `app/` directory is removed from the host after
  recording (it is not committed to the forge-starter template — users create it via `./new-app`).
  Fixes: working tree was dirty after the previous fixture commit because build artifacts
  under `app/` were left as untracked files; those are now cleaned up, leaving a clean tree.

### Added

- **`fixtures/make-the-app/` — Docker-only quickstart proof fixture** recorded against Forge
  `v1.55.0`. Captures the full `git clone → export FORGE_SECRETS_KEY → ./new-app hello
--with-postgres --dev` runbook: hops with raw forge payloads, forge event timeline,
  before/after state, and a health-check confirmation (`status: ok, health: healthy`). README
  names the exact image tags and documents the two machine-specific observations (port-5432
  conflict workaround; intermittent init→provision race to report upstream). Self-contained so
  it can move to the developer site repo unchanged (skill-set-plan §4.4 "one recording, two uses").

### Added

- **`starter-model.json` — versioned, machine-readable snapshot of the starter's state.**
  Added `scripts/generate-starter-model.mjs` (plain Node, no install) that reads
  `compose.yaml` (image pins), `.claude/skills/*/SKILL.md` (skill name, description, and
  `./forge` capability mapping table parsed from each file), the CLAUDE.md "one rule"
  contract block, and `fixtures/*/hops.json` (scenario keys), then writes a committed,
  version-stamped `starter-model.json` under `$schema: https://forge.build/starter-model/v1`.
  The root `package.json` `version` lifecycle hook runs the generator automatically on
  every `npm version` bump and stages the result.

- **`scripts/diff-starter-model.mjs` — deterministic diff between two starter models.**
  Compares two `starter-model.json` files (version, platform images, skills, fixtures) and
  emits `starter-changes.json` (structured) and `starter-changes.md` (human-readable Markdown).
  Output is fully deterministic: all lists are sorted, so repeated runs on the same inputs
  produce byte-identical files.

- **`scripts/test-diff.mjs` — test suite for the generator and diff scripts.**
  Plain Node test covering: valid model structure, skill/fixture required fields, generator
  idempotence, diff identity (no false positives), version/image change detection, first-release
  (empty previous model) handling, and output stability across runs. Runs via `npm test`.

- **Root `package.json`** (`private: true`, `version: 0.1.0`, no dependencies) with
  `generate:starter-model`, `diff:starter-model`, `test`, and `typecheck` scripts. The
  `version` script (`npm run generate:starter-model && git add starter-model.json`) hooks
  into the npm version lifecycle so releases always carry a fresh model.

- **`.github/workflows/ci.yml` drift guard** (`starter-model` job). On every push and PR,
  CI regenerates `starter-model.json` and fails if the committed copy is out of date —
  enforcing that the model is always in sync with the repo. The same job runs
  `npx prettier --check .`, `npm run typecheck`, and `npm test`.

- **`.github/workflows/release.yml`** runs on `v*` tags: regenerates the starter model,
  diffs against the previous tag's `starter-model.json` (falling back to an empty model on
  the first release), and creates a GitHub Release with `starter-model.json`,
  `starter-changes.json`, and `starter-changes.md` attached.

- **README "Releases and the starter model" section** documenting the model file layout,
  the CI drift guard, the release workflow, and the available scripts.

## [0.4.0] — 2026-07-11

Inherit the **Forge 0.35.0 deployable-consumer scaffolding** — **deploy toolchain only**. A full
capability catch-up (C19 search, C20 notes/attachments, C23 server sessions, C29, …) is a separate
later pass; this release brings only the deploy toolchain + single-app layout current.

### Added

- **Adopt the `forge release` deploy pipeline and its `Makefile` targets.** `make provision` /
  `make productionize` / `make release` (aliased `make deploy`) now wrap
  `./forge provision --app <APP> --platform-store postgres --secret AUTH_SESSION_SECRET`,
  `./forge productionize --app <APP> --host <DOMAIN>`, and `./forge release --app <APP> --host <DOMAIN>`
  (assess → publish → repin → zero-downtime deploy → verify; idempotent). `deploy-ps` / `deploy-logs` /
  `deploy-down` operate on the generated `app/compose.prod.yaml`.

### Changed

- **Bump the Forge control-plane and data-plane images to `0.35.0`.** `compose.yaml` pins
  `forge-control-plane:0.35.0` and passes `FORGE_DATA_PLANE_IMAGE=forge-data-plane:0.35.0` (replacing the
  `0.21.1` digests), now sets `FORGE_PLATFORM_STORE=postgres`, **requires** `FORGE_SECRETS_KEY` (compose
  refuses to start without it), forwards `GITHUB_TOKEN`, binds `127.0.0.1:3717`, and runs from
  `working_dir: /forge`.
- **Move the production stack under `app/` (single-app layout).** `forge productionize` now generates
  `app/compose.prod.yaml` — prod compose project `forge-<APP>-prod`, which namespaces containers, network,
  and volumes so multiple apps on one host share nothing but the external `proxy` Traefik network — with a
  DB-aware data-plane sidecar wired via `FORGE_DB_URL` and Traefik `Host(<DOMAIN>)`, plus
  `app/.env.prod.example` + `app/PROVISIONING.md`. `DEPLOY.md` documents the full
  `provision → productionize → fill app/.env.prod → release` flow and the stable secret set
  (`FORGE_SECRETS_KEY`, `FORGE_PLATFORM_DB_PASSWORD`, `AUTH_SESSION_SECRET` for **C10 and C23**, optional
  `POSTGRES_PASSWORD` / Google / SMTP; C23 adds no new secret).
- **Relocate scheduled jobs to `app/forge.jobs.json`.** The data-plane reads its cron jobs from a JSON
  array in the app dir (was `deploy/jobs.json`); `DEPLOY.md` carries the example.
- **Ignore single-app `app/` paths.** `.gitignore` now ignores `app/node_modules/`, `app/.next/`,
  `app/next-env.d.ts`, `app/.env`, and `app/.env.prod` (replacing the `apps/*` plural pattern and the root
  `.env.prod`); the control-plane `.env` (holding `FORGE_SECRETS_KEY`) and `release/` stay ignored.
- **Update `.env.example` and the quickstart for the required control-plane key.** `.env.example` documents
  `FORGE_SECRETS_KEY` (required) and optional `GITHUB_TOKEN`, dropping the retired `FORGE_IMAGE` /
  `FORGE_PORT` overrides; `README.md` adds the `cp .env.example .env` + set-key step and corrects the
  run-two-projects-at-once note. The root `.env.prod.example` is reframed as a pre-scaffold reference that
  points at the generated `app/.env.prod.example` + `app/PROVISIONING.md`.

### Removed

- **The stale root `compose.prod.yaml` and the `deploy/` directory.** The production compose file is now
  generated into `app/` by `forge productionize`, and scheduled jobs moved to `app/forge.jobs.json`, so the
  hand-maintained root prod compose and `deploy/jobs.json` / `deploy/jobs.example.json` are gone.

### Fixed

- **Carry the Forge CLI-wrapper fixes (P16 / P20 / P22) into `./forge`.** The wrapper starts only the `api`
  service, polls `http://127.0.0.1:3717/health` for readiness (P20 loopback, P22 readiness poll), and
  launches `tsx -- src/cli/index.ts` (the P16 `--`, so a relative `--env-file` is not hoisted into node and
  cannot abort the CLI at startup).

## [0.3.0] — 2026-07-08

### Added

- **Inherit the platform status page (C15).** The Forge platform now serves a Statuspage-style public
  **`/status`** (HTML) + **`/status.json`** for a productionized app, aggregating its health. `DEPLOY.md`
  documents it and the opt-in **uptime history** (a background sampler + per-day timeline) enabled with
  **`FORGE_STATUS_SAMPLE=1`** in `app/.env.prod`. Platform-served — nothing to build in the app.
- **Inherit app theming (C16).** A **`forge.theme.json`** at the app root now brands **all**
  platform-served UI — the sign-in pages _and_ the `/status` page — via `--forge-*` CSS tokens (a pinned
  `mode: "dark"` makes `colors{}` the whole dark palette). Documented in `DEPLOY.md` and added to the
  `README.md` "What is this directory?" table as an optional file; absent → the platform's neutral defaults.
- **Inherit `forge verify` (C14).** `DEPLOY.md` now describes `forge verify --app <app> --host <host>` — a
  post-deploy smoke check that asserts the C6 health / C10 auth contracts and **exits non-zero** on any
  violation — as a recommended CI gate after `make deploy`.

### Changed

- **Bump the Forge control-plane and data-plane images to `0.21.1` by digest.** `.env.example`,
  `compose.yaml`, `.env.prod.example`, and `compose.prod.yaml` now pin
  `forge-control-plane:0.21.1@sha256:4635b861…` and `forge-data-plane:0.21.1@sha256:ab18a154…`,
  replacing the `0.17.0` pins. Both planes move together, so a productionized clone never ships
  mismatched control/data planes.
- **Document the deploy drift-gate (P14).** `DEPLOY.md` now notes that `forge deploy` fails loudly when a
  running container's image doesn't match the digest pinned in `compose.prod.yaml`/`app/.env.prod`, and
  **force-recreates** on a pin change — so a deploy can't silently keep serving a stale image.

### Fixed

- **Carry the Forge CLI-wrapper fix (P16) so cloned apps aren't born broken.** The `./forge` wrapper now
  launches the CLI as `tsx -- src/cli/index.ts "$@"` (note the **`--`**) instead of
  `tsx src/cli/index.ts "$@"`. Without the separator, `tsx` hoisted a relative CLI flag (e.g.
  `--env-file app/.env.prod`) into node and aborted `forge deploy` at startup; every clone inherits this
  static wrapper, so the fix ships to new apps.

## [0.2.3] — 2026-07-08

### Changed

- **Bump the Forge control-plane and data-plane images to `0.17.0` by digest.** `.env.example`,
  `compose.yaml`, `.env.prod.example`, and `compose.prod.yaml` now pin
  `forge-control-plane:0.17.0@sha256:69fe7ea2…` and `forge-data-plane:0.17.0@sha256:465ae7cc…`,
  replacing the `0.15.1` pins. Both planes move together, so a productionized clone never ships
  mismatched control/data planes.
- **Inherit the Forge operator-provisioning generator (C13) so cloned apps ship a per-app runbook.**
  On control plane ≥ `0.17.0`, `forge productionize` now also generates an **annotated
  `app/.env.prod.example`** (each secret prefixed with what it is, which capability needs it,
  required/optional, how to obtain it, and a generate command) and a generated **`app/PROVISIONING.md`**
  operator runbook — including an "Enabling a working sign-in method" section when the app declares
  auth. `DEPLOY.md` now points operators at that generated pair (`forge productionize` → read
  `app/PROVISIONING.md` → fill `app/.env.prod` → `forge deploy`) instead of hand-listing secrets that
  would drift, and copies `app/.env.prod` from the generated `app/.env.prod.example`. The prior
  productionize output (Dockerfile, `compose.prod.yaml`, `next.config.mjs`) is unchanged.
- **Reframe the tracked root `.env.prod.example` as the pre-scaffold reference.** It carries the
  `0.17.0` pins and now points at the generated `app/PROVISIONING.md` + annotated `app/.env.prod.example`
  as the authoritative per-app runbook once `./app` exists; the `compose.prod.yaml` header hint and the
  `Makefile` deploy comment reference the generated pair as well, so provisioning docs no longer
  duplicate a secrets list the generator owns.

## [0.2.2] — 2026-07-07

### Changed

- **Bump the Forge control-plane and data-plane images to `0.15.1` by digest.** `.env.example`,
  `compose.yaml`, `.env.prod.example`, and `compose.prod.yaml` now pin
  `forge-control-plane:0.15.1@sha256:925ffd09…` and `forge-data-plane:0.15.1@sha256:804f5c47…`,
  replacing the `0.11.0` pins. This platform release fixes two deploy blockers that cloned apps
  inherit through `forge init`: `forge deploy` defaults its `--env-file` to `app/.env.prod` (P10),
  and the generated/scaffolded `app/next.config.mjs` **always** emits the `/auth/*` (data-plane)
  rewrite — defaulted to `http://data-plane:3718` — so it survives `next build` into the production
  image and `/auth/login` serves instead of 404ing (P11).
- **Adopt the `app/.env.prod` production-env convention (P10).** `DEPLOY.md`, `.env.prod.example`,
  the `compose.prod.yaml` header hint, and the `Makefile` deploy helpers now name `app/.env.prod` as
  the file you copy the template to and that a plain `forge deploy` loads (its `--env-file` default),
  replacing the old repo-root `.env`. The `make deploy-config` / `deploy-ps` / `deploy-down` helpers
  pass `--env-file app/.env.prod` so plain-compose commands resolve the same `APP_NAME`, host, and
  image pins as the deploy roll.

### Fixed

- **Ignore `app/.env.prod` so clones never commit production secrets.** With the prod env moving off
  the (already-ignored) repo-root `.env` onto `app/.env.prod` (P10), a new `.gitignore` rule ignores
  `.env.prod` while keeping the tracked `.env.prod.example` template.

## [0.2.1] — 2026-07-07

### Changed

- **Move the version manifest to `app/package.json`, aligning forge-starter with the rest of
  mardash.** `/commit-code` now bumps the version with
  `npm version <directive> --no-git-tag-version --prefix app`, so every cloned app versions its own
  build manifest. The bare template repo — which scaffolds its app on clone and ships no `./app` —
  records its own version in this `CHANGELOG.md` heading plus the `v<new>` git tag, and `/commit-code`
  skips the `npm version` bump when no `app/package.json` is present. The canonical changelog
  discipline (em-dash `## [X.Y.Z] — <date>` headings, footer compare links) is unchanged.

### Removed

- **The root `package.json`.** The Docker-only template advertises no root Node toolchain, so the
  standalone repo-level version manifest is gone; `app/package.json` (present in every clone) is the
  source of truth instead.

## [0.2.0] — 2026-07-07

### Changed

- **Adopt the Forge `Productionize` capability — generate the production artifacts instead of
  hand-staging them.** `DEPLOY.md` now productionizes a cloned app with `forge productionize --app
<app> --host <domain> --web-image <ref@sha256:…>`, which generates `app/Dockerfile`,
  `app/.dockerignore`, `output: 'standalone'` in `app/next.config.mjs`, `compose.prod.yaml`, and
  `.env.prod.example` — digest-pinned and convergent — then rolls them with `forge deploy`. The
  readiness-path and host-rule choices are kept as inputs you pass to the command.
- **Pin the Forge control-plane image to `0.11.0` by digest.** `compose.yaml`, `.env.example`, and
  `.env.prod.example` now reference `ghcr.io/mardash-ai/forge-control-plane:0.11.0@sha256:50fa8ad…`
  (the plane that ships `forge productionize`), and the data-plane sidecar is pinned to
  `forge-data-plane:0.11.0@sha256:0528e92…`, replacing the `:latest` tags.
- **`publish-app.yml`: describe `app/Dockerfile` as generated by `forge productionize`** rather than
  copied from the removed staging directory.

### Removed

- **The manual production-artifact staging.** Delete the `deploy/app-image/` directory (the
  hand-staged `Dockerfile` and `.dockerignore` that were copied into `app/`) and the manual
  "set `output: 'standalone'`" / "copy the Dockerfile into `app/`" steps in `DEPLOY.md`, now that
  `forge productionize` generates these directly.

## [0.1.1] — 2026-07-06

### Added

- **Canonical `CHANGELOG.md` and release versioning.** Adopt the Keep a Changelog 1.1.0 / Semantic
  Versioning 2.0.0 format used across mardash — em-dash version headings (`## [X.Y.Z] — YYYY-MM-DD`),
  a permanent empty `## [Unreleased]` section, and footer compare links against the GitHub remote —
  and add a private root `package.json` whose `version` is the release source of truth. New apps
  cloned from this template inherit the format and the version manifest.
- **`/commit-code` slash command** (`.claude/commands/commit-code.md`). Enforce a Semantic Versioning
  bump (`npm version`, default `patch`) plus a matching dated `CHANGELOG.md` entry on every commit to
  `main`, deriving the project from `package.json` and the git remote so cloned apps get the same
  release discipline. It never publishes an image and never pushes a tag.

## [0.1.0] — 2026-07-06

### Added

- **Forge Builder workspace scaffold.** Ship a single-app template (`FORGE_APP_LAYOUT=single`) that
  runs the Forge platform in Docker and builds the app at `./app` through `./forge` and `./new-app`,
  with no local Node toolchain required. Bundle the Claude Code skills (`add-a-feature`,
  `provision-app`, `frontend-design`), a scoped `CLAUDE.md`, and `specs/ADD_A_FEATURE.md`.
- **Production deployment pipeline with zero-downtime deploys.** Add `compose.prod.yaml` (a
  Traefik-fronted `web` service, an optional Forge data-plane sidecar, and Postgres, health-gated for
  rolling updates), `.env.prod.example`, a `deploy/` directory (`jobs.json` plus a standalone
  `app-image/` Dockerfile template), CI and publish GitHub workflows (guarded so the bare template
  stays green), and [`DEPLOY.md`](DEPLOY.md). `make deploy` runs the Forge **`Deploy` capability**
  (`forge deploy`, control plane ≥ 0.6.1) — a start-first roll of the public `web` service with
  automatic rollback — so zero-downtime lives in the platform and the app just consumes it.

### Changed

- **`provision-app` skill: document `provision` as convergent on control plane ≥ 0.3.0.** Read the
  app's desired infrastructure (Postgres/Redis, secrets, host-port remaps) from `forge.app.json` and
  converge — flags are additive, a flag-less re-provision drops nothing, and dropping a data-volume
  service requires `--force`. Scope the old "re-pass every flag or lose services" warning to control
  planes older than `0.3.0`.

[Unreleased]: https://github.com/mardash-ai/forge-starter/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/mardash-ai/forge-starter/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mardash-ai/forge-starter/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/mardash-ai/forge-starter/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/mardash-ai/forge-starter/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/mardash-ai/forge-starter/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/mardash-ai/forge-starter/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/mardash-ai/forge-starter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mardash-ai/forge-starter/commit/0584fd31a129695fef28e89a6079f1a7ca01afff
