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
  - Version source of truth is package.json "version". SemVer: feature => MINOR, fix => PATCH,
    breaking => MAJOR. `/commit-code` bumps the version and adds the matching dated entry.
  - Keep the footer compare links (newest first) in sync with the GitHub remote.
-->

## [Unreleased]

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

[Unreleased]: https://github.com/mardash-ai/forge-starter/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/mardash-ai/forge-starter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mardash-ai/forge-starter/commit/0584fd31a129695fef28e89a6079f1a7ca01afff
