---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(git tag:*), Bash(npm version:*), Bash(node:*), Bash(basename:*), Bash(date:*), Read, Edit, Write
argument-hint: [patch|minor|major|X.Y.Z] [commit message]
description: Bump the SemVer version, update CHANGELOG.md, and commit (no image publish, no tag push)
---

## What this does

Records the working changes as one commit with a **Semantic Versioning bump** and a matching
**CHANGELOG.md** entry. It **never publishes an image and never pushes a tag** — releasing an image
is a separate, tag-triggered CI concern.

This command ships in the **forge-starter** template, so it is inherited by every app cloned from it.
Keep it generic: it derives the project from `package.json` / the git remote and hardcodes no project
name.

## Arguments

`$ARGUMENTS` — the first token is the **version directive**, the rest is the **commit message**.

- Directive: `patch` (default if omitted or unrecognized), `minor`, `major`, or an explicit `X.Y.Z`.
  SemVer policy: **feature ⇒ minor** (resets patch to 0), **bug fix ⇒ patch**, **breaking ⇒ major**.
- Message: free text. If omitted, generate a concise **Conventional Commits** summary from the diff
  (e.g. `feat: …`, `fix: …`, `chore: …`).

## Context (auto-collected)

- Current branch: !`git branch --show-current`
- Working tree status: !`git status --short`
- Staged + unstaged diff: !`git diff HEAD`
- Recent commits: !`git log --oneline -10`
- Current version: !`node -p "require('./package.json').version"`
- Today (ISO 8601): !`date +%F`
- Origin remote: !`git remote get-url origin`

## Steps

1. **Guard the branch.** If the current branch is not `main`, **stop** and tell the user to switch to
   `main` (or open a PR). Do nothing else.

2. **Resolve the target version.** Read `version` from `package.json` (the source of truth). Apply the
   directive: `patch`/`minor`/`major` bump per SemVer, or use the explicit `X.Y.Z` verbatim. Call the
   result `<new>`. Derive `<owner>/<repo>` from `git remote get-url origin` and `<today>` from the
   context above.

3. **Require a canonical CHANGELOG entry — refuse to proceed without it.** Edit `CHANGELOG.md` so it
   contains a section `## [<new>] — <today>` (the separator is an **EM DASH `—`**, U+2014, not a
   hyphen) in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format:
   - **Move** everything currently under `## [Unreleased]` into the new `## [<new>]` section, then
     leave `## [Unreleased]` empty. If `[Unreleased]` is empty, write fresh bullets that describe the
     changes in the diff above.
   - Group bullets under `### Added`, `### Changed`, `### Fixed` (only those needed, in that order).
     Lead bullets are **bold-scope-prefixed** and end with a period; sub-bullets indent 2 spaces.
     Present-tense full sentences; inline code in backticks; no commit hashes or URLs in bullets.
   - Update the **footer compare links** at the bottom, newest first:
     - `[Unreleased]: https://github.com/<owner>/<repo>/compare/v<new>...HEAD`
     - `[<new>]: https://github.com/<owner>/<repo>/compare/v<prev>...v<new>`
     - Leave the older links (the oldest points to `/commit/<initial-sha>`) intact.
   - If `CHANGELOG.md` does not exist, create it from the template's preamble first.
   - **If you cannot produce a truthful entry for this bump, stop** — do not bump or commit.

4. **Bump the version.** Run:

   ```bash
   npm version <directive> --no-git-tag-version
   ```

   (For an explicit target, `npm version <X.Y.Z> --no-git-tag-version`.) This updates
   `package.json` (and `package-lock.json` if present). Confirm the result equals `<new>`; if not,
   reconcile the CHANGELOG heading to match `package.json`.

5. **Commit.** Stage and commit everything as a single commit:

   ```bash
   git add -A
   git commit -m "<message>" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
   ```

   The message follows Conventional Commits and ends with the `Co-Authored-By` trailer above.

6. **Do NOT publish or push.** Do **not** build or push any image, and do **not** push a tag. The
   annotated `v<new>` tag is the release signal, but creating/pushing it is the maintainer's explicit,
   separate action — this command stops at the local commit. (A maintainer may optionally run
   `git tag -a v<new> -m "v<new>"` locally afterward; this command does not.)
