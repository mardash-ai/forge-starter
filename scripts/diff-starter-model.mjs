#!/usr/bin/env node
// scripts/diff-starter-model.mjs
// Deterministically diffs two starter-model.json files.
// Usage: node scripts/diff-starter-model.mjs <prev.json> [next.json]
// Outputs: starter-changes.json  starter-changes.md  (in the repo root)

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Compute a structured diff between two starter models. */
function diffModels(prev, next) {
  const prevImages = prev.images ?? {};
  const nextImages = next.images ?? {};
  const prevSkills = prev.skills ?? [];
  const nextSkills = next.skills ?? [];
  const prevFixtures = prev.fixtures ?? [];
  const nextFixtures = next.fixtures ?? [];

  // Image comparisons
  const cpFrom = prevImages.controlPlane ?? null;
  const cpTo = nextImages.controlPlane ?? null;
  const dpFrom = prevImages.dataPlane ?? null;
  const dpTo = nextImages.dataPlane ?? null;

  // Skill comparisons (by name)
  const prevSkillMap = new Map(prevSkills.map((s) => [s.name, s]));
  const nextSkillMap = new Map(nextSkills.map((s) => [s.name, s]));
  const skillsAdded = [...nextSkillMap.keys()]
    .filter((n) => !prevSkillMap.has(n))
    .sort();
  const skillsRemoved = [...prevSkillMap.keys()]
    .filter((n) => !nextSkillMap.has(n))
    .sort();
  const skillsChanged = [...nextSkillMap.keys()]
    .filter(
      (n) =>
        prevSkillMap.has(n) &&
        JSON.stringify(prevSkillMap.get(n)) !==
          JSON.stringify(nextSkillMap.get(n)),
    )
    .sort();

  // Fixture comparisons (by scenario)
  const prevScenarios = new Set(prevFixtures.map((f) => f.scenario));
  const nextScenarios = new Set(nextFixtures.map((f) => f.scenario));
  const fixturesAdded = [...nextScenarios]
    .filter((s) => !prevScenarios.has(s))
    .sort();
  const fixturesRemoved = [...prevScenarios]
    .filter((s) => !nextScenarios.has(s))
    .sort();

  return {
    from: prev.version ?? "none",
    to: next.version ?? "none",
    version: {
      from: prev.version ?? null,
      to: next.version ?? null,
      changed: prev.version !== next.version,
    },
    images: {
      controlPlane: { from: cpFrom, to: cpTo, changed: cpFrom !== cpTo },
      dataPlane: { from: dpFrom, to: dpTo, changed: dpFrom !== dpTo },
    },
    skills: {
      added: skillsAdded,
      removed: skillsRemoved,
      changed: skillsChanged,
    },
    fixtures: {
      added: fixturesAdded,
      removed: fixturesRemoved,
    },
  };
}

/** Render a diff to Markdown. */
function toMarkdown(diff) {
  const lines = [`# Starter Model Changes: ${diff.from} → ${diff.to}`, ""];

  const hasVersionChange = diff.version.changed;
  const hasImageChange =
    diff.images.controlPlane.changed || diff.images.dataPlane.changed;
  const hasSkillChange =
    diff.skills.added.length ||
    diff.skills.removed.length ||
    diff.skills.changed.length;
  const hasFixtureChange =
    diff.fixtures.added.length || diff.fixtures.removed.length;
  const hasAnyChange =
    hasVersionChange || hasImageChange || hasSkillChange || hasFixtureChange;

  if (!hasAnyChange) {
    lines.push("_No changes._");
    return lines.join("\n") + "\n";
  }

  if (hasVersionChange) {
    lines.push(
      "## Version",
      "",
      `- **${diff.version.from}** → **${diff.version.to}**`,
      "",
    );
  }

  if (hasImageChange) {
    lines.push("## Platform Images", "");
    if (diff.images.controlPlane.changed) {
      lines.push(
        `- Control plane: \`${diff.images.controlPlane.from}\` → \`${diff.images.controlPlane.to}\``,
      );
    }
    if (diff.images.dataPlane.changed) {
      lines.push(
        `- Data plane: \`${diff.images.dataPlane.from}\` → \`${diff.images.dataPlane.to}\``,
      );
    }
    lines.push("");
  }

  if (hasSkillChange) {
    lines.push("## Skills", "");
    for (const s of diff.skills.added) lines.push(`- Added: \`${s}\``);
    for (const s of diff.skills.removed) lines.push(`- Removed: \`${s}\``);
    for (const s of diff.skills.changed) lines.push(`- Changed: \`${s}\``);
    lines.push("");
  }

  if (hasFixtureChange) {
    lines.push("## Fixtures", "");
    for (const f of diff.fixtures.added) lines.push(`- Added: \`${f}\``);
    for (const f of diff.fixtures.removed) lines.push(`- Removed: \`${f}\``);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    "Usage: node scripts/diff-starter-model.mjs <prev.json> [next.json]",
  );
  process.exit(1);
}

const prevPath = args[0];
const nextPath = args[1] ?? join(ROOT, "starter-model.json");

const prev = JSON.parse(readFileSync(prevPath, "utf8"));
const next = JSON.parse(readFileSync(nextPath, "utf8"));

const diff = diffModels(prev, next);
const md = toMarkdown(diff);

writeFileSync(
  join(ROOT, "starter-changes.json"),
  JSON.stringify(diff, null, 2) + "\n",
);
writeFileSync(join(ROOT, "starter-changes.md"), md + "\n");

console.log("Diff written: starter-changes.json, starter-changes.md");
