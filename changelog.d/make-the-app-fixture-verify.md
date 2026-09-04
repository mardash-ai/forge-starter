### Fixed

- **`fixtures/make-the-app/after-state.json` — re-verified live state and added cleanup note.**
  Re-ran `./forge inspect app/docker/routes`, `./forge dev`, and `curl /api/health` against the
  running hello app; updated resource IDs and timestamps to the observed values. Added
  `cleanup_note` documenting that the demo `app/` directory is removed from the host after
  recording (it is not committed to the forge-starter template — users create it via `./new-app`).
  Fixes: working tree was dirty after the previous fixture commit because build artifacts
  under `app/` were left as untracked files; those are now cleaned up, leaving a clean tree.
