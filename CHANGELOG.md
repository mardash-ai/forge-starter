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

### Changed

- **`provision-app` skill: `provision` is now documented as convergent on control-plane ≥ 0.3.0.**
  Reads the app's desired infra (Postgres/Redis, secrets, host-port remaps) from `forge.app.json`
  and converges — flags are additive, a flag-less re-provision drops nothing, and dropping a
  data-volume service needs `--force`. The old "re-pass every flag or you'll lose services" warning
  is now scoped to control planes older than `0.3.0`.
