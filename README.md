# Forge Starter

The drop-dead simplest way to start building with **Forge**. This is *your project* — Forge
runs alongside it as a container. **Every repo is a single app**, and it lives at `./app`.
Everything runs in Docker.

## Requirements

Just **Docker** (with the Compose plugin — included in Docker Desktop). No Node, npm, or
anything else.

> Forge runs as its **control plane** image (`ghcr.io/mardash-ai/forge-control-plane`) — the
> developer/orchestration runtime. (A separate, slimmer **data plane** image handles
> production/deploy later; it won't carry developer dependencies.)

## From zero to a working app — one command

```bash
# 1. Get this starter (or click "Use this template" on GitHub)
git clone https://github.com/mardash-ai/forge-starter my-project
cd my-project

# 2. Set the control-plane secret key (REQUIRED — the platform won't start without it):
cp .env.example .env
# then edit .env and set FORGE_SECRETS_KEY (e.g. `openssl rand -hex 32`)

# 3. Create a fully built, tested, linted app in one command:
./new-app my-app
```

`./new-app` starts the platform, then runs the whole lifecycle — **init → provision → install
→ build → test → lint** — checking each step, diagnosing any failure for you, and printing a
summary. Options:

```bash
./new-app my-app --with-postgres      # add a Postgres service
./new-app my-app --with-redis         # add a Redis service
./new-app my-app --dev                # also start the dev server and wait for health
```

Your app is created at **`./app`** (one app per repo). Run it any time:

```bash
./forge dev --app my-app              # http://localhost:3000
```

## Even simpler: let Claude drive

This starter ships Claude Code skills (`.claude/skills/`) and a `CLAUDE.md`. Open the project
in Claude Code and just say:

> **"Build me a task tracker."**

Claude runs `./new-app` (or the granular steps), fixes failures itself using `forge explain`,
and iterates. You never have to remember commands.

### Skills that ship with this starter

The `.claude/skills/` directory gives Claude project-specific know-how so it drives Forge the
right way. Three skills come bundled:

| Skill | What it does |
|---|---|
| **`add-a-feature`** | The spec-driven, design-first workflow for adding or evolving a feature — write a short spec, design the UI first, implement under `./app`, then validate and verify end-to-end. |
| **`provision-app`** | The Forge mechanics — scaffold, provision, install, build, test, and lint the app in Docker via `./forge`, diagnosing failures with `forge explain`. |
| **`frontend-design`** | Guidance for distinctive, intentional UI — typography, layout, and aesthetic choices that don't read as templated defaults. |

You don't invoke these directly; Claude picks the right one for what you ask.

## Iterating step by step

Once the app exists, work capability by capability:

```bash
./forge build --app my-app            # rebuild after edits
./forge test  --app my-app
./forge lint  --app my-app
./forge inspect app|routes|scripts|docker|events --app my-app
./forge explain --resource <id>       # compact failure diagnosis (no log dump)
./forge plan --app my-app --goal "Add project tracking"
```

Every `./forge` command returns compact JSON with a `suggested_next` hint. Add `--summary`
for human-readable output, or `./forge logs <id> --full` for a full log.

## Adding features (spec-driven, design-first)

Write a short feature spec (a Goal + acceptance criteria) in `specs/<feature-slug>/FEATURE.md`
and let Claude implement and validate it — designing the UI first for anything visual. See
**[specs/ADD_A_FEATURE.md](specs/ADD_A_FEATURE.md)** for the template, and the **`add-a-feature`**
skill for the full workflow.

## What is this directory?

| Path | What it is |
|---|---|
| `app/` | **Your app** — the product. Created at `./app` by `./new-app` / `./forge init`. Commit it. |
| `forge.theme.json` | *(optional)* Brand **all** platform-served UI (sign-in + the `/status` page) via `--forge-*` CSS tokens. Absent → neutral defaults. See [DEPLOY.md](DEPLOY.md). |
| `specs/` | Feature specs — `specs/ADD_A_FEATURE.md` + `specs/<feature>/{FEATURE,DESIGN}.md`. |
| `.forge/` | Forge's local Resource/Event/log store (gitignored). |
| `.claude/skills/` | `add-a-feature`, `provision-app`, `frontend-design`. |
| `./new-app` | One command: scaffold + validate the app. |
| `./forge` | Thin CLI → talks to the Forge control-plane container. |
| `compose.yaml`, `Makefile` | Launch the platform. Leave them alone. |

There is **no Forge source here** — Forge is a black-box platform you use through `./forge` /
`./new-app` (and the HTTP API on `http://localhost:3717`). Your app never imports Forge
internals.

## Commands

```bash
./new-app <name>            # scaffold + build + test + lint the app (one command)
make up / make down          # start / stop the platform
make logs / make shell       # tail logs / shell into the platform
make pull                    # update the control-plane image
```

## Running more than one project at once

Each clone is isolated by its **directory** — its own Compose project (containers + volumes), its
own `./.forge` state, and its own `./app`. The dev control plane binds `127.0.0.1:3717`, so to run
**two** projects at the same time, change the published port in one project's `compose.yaml`
(`ports` and `PORT`) so they don't collide on `3717`.
