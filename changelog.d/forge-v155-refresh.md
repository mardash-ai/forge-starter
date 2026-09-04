---
bump: minor
---

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
