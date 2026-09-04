### Added

- **`fixtures/make-the-app/` — Docker-only quickstart proof fixture** recorded against Forge
  `v1.55.0`. Captures the full `git clone → export FORGE_SECRETS_KEY → ./new-app hello
  --with-postgres --dev` runbook: hops with raw forge payloads, forge event timeline,
  before/after state, and a health-check confirmation (`status: ok, health: healthy`). README
  names the exact image tags and documents the two machine-specific observations (port-5432
  conflict workaround; intermittent init→provision race to report upstream). Self-contained so
  it can move to the developer site repo unchanged (skill-set-plan §4.4 "one recording, two uses").
