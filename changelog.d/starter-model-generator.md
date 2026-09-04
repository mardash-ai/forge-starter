---
bump: minor
---

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
