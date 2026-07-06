# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries accrue under **[Unreleased]** and move into a dated, versioned section when a release is
cut. Bump the version by the nature of the change: **MAJOR** for breaking changes, **MINOR** for
new backwards-compatible features, **PATCH** for backwards-compatible fixes. The `/commit-code`
skill appends to `[Unreleased]` automatically on every commit.

## [Unreleased]

### Added

- Initial project scaffold from **forge-starter**.
- **Production deployment pipeline with zero-downtime deploys.** New `compose.prod.yaml`
  (Traefik-fronted `web` + optional Forge data-plane sidecar + Postgres, health-gated for
  rolling), `.env.prod.example`, `deploy/` (`jobs.json` + the standalone `app-image/` Dockerfile
  template), CI/publish GitHub workflows (guarded so the bare template stays green), and
  [`DEPLOY.md`](DEPLOY.md). `make deploy` starts the control plane transiently and runs the Forge
  **`Deploy` capability** (`forge deploy`, control plane ≥ 0.6.1) — a start-first roll of the public
  `web` service with automatic rollback, so the site never loses its backend. No `rollout.sh` to
  maintain: zero-downtime lives in the platform, and apps consume it.

### Changed

- **`provision-app` skill: `provision` is now documented as convergent on control-plane ≥ 0.3.0.**
  Reads the app's desired infra (Postgres/Redis, secrets, host-port remaps) from `forge.app.json`
  and converges — flags are additive, a flag-less re-provision drops nothing, and dropping a
  data-volume service needs `--force`. The old "re-pass every flag or you'll lose services" warning
  is now scoped to control planes older than `0.3.0`.
