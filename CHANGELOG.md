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

[Unreleased]: https://github.com/mardash-ai/forge-starter/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/mardash-ai/forge-starter/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/mardash-ai/forge-starter/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/mardash-ai/forge-starter/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/mardash-ai/forge-starter/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/mardash-ai/forge-starter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mardash-ai/forge-starter/commit/0584fd31a129695fef28e89a6079f1a7ca01afff
