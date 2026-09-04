#!/usr/bin/env node
// scripts/test-diff.mjs
// Test suite for generate-starter-model.mjs and diff-starter-model.mjs.
// Plain Node — no install required.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TMP = join(ROOT, ".tmp-test-diff");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "pipe" });
}

function cleanup() {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
}

// ─── Setup ──────────────────────────────────────────────────────────────────

cleanup();
mkdirSync(TMP, { recursive: true });

// ─── Test 1: Generator produces a valid model ────────────────────────────────

console.log("\n1. Generator produces a valid starter-model.json");
run("node scripts/generate-starter-model.mjs");
const modelPath = join(ROOT, "starter-model.json");
assert(existsSync(modelPath), "starter-model.json exists");
const model = JSON.parse(readFileSync(modelPath, "utf8"));
assert(
  model.$schema === "https://forge.build/starter-model/v1",
  "$schema === https://forge.build/starter-model/v1",
);
assert(
  typeof model.version === "string" && model.version.length > 0,
  "version is a non-empty string",
);
assert(
  typeof model.images?.controlPlane === "string" &&
    model.images.controlPlane.startsWith("ghcr.io/"),
  "images.controlPlane is a ghcr.io/ image",
);
assert(
  typeof model.images?.dataPlane === "string" &&
    model.images.dataPlane.startsWith("ghcr.io/"),
  "images.dataPlane is a ghcr.io/ image",
);
assert(
  Array.isArray(model.skills) && model.skills.length > 0,
  "skills is a non-empty array",
);
assert(
  typeof model.oneRuleContract === "string" && model.oneRuleContract.length > 0,
  "oneRuleContract is a non-empty string",
);
assert(
  Array.isArray(model.fixtures) && model.fixtures.length > 0,
  "fixtures is a non-empty array",
);

// ─── Test 2: Skill entries have required fields ──────────────────────────────

console.log("\n2. Skill entries have required fields");
for (const skill of model.skills) {
  assert(
    typeof skill.name === "string" && skill.name.length > 0,
    `skill has name (got: ${skill.name})`,
  );
  assert(
    typeof skill.description === "string",
    `skill '${skill.name}' has description`,
  );
  assert(
    Array.isArray(skill.forgeMapping),
    `skill '${skill.name}' has forgeMapping array`,
  );
  // forgeMapping may be empty for design/guidance skills that have no direct forge commands
}

assert(
  model.skills.some((s) => s.forgeMapping.length > 0),
  "at least one skill has forge mappings",
);

// ─── Test 3: Fixture entries have required fields ────────────────────────────

console.log("\n3. Fixture entries have required fields");
for (const fixture of model.fixtures) {
  assert(
    typeof fixture.scenario === "string" && fixture.scenario.length > 0,
    `fixture has scenario key (got: ${fixture.scenario})`,
  );
  assert(
    Array.isArray(fixture.scenarioKeys),
    `fixture '${fixture.scenario}' has scenarioKeys array`,
  );
  assert(
    Array.isArray(fixture.files) && fixture.files.length > 0,
    `fixture '${fixture.scenario}' has files array`,
  );
}

// ─── Test 4: Generator is deterministic ─────────────────────────────────────

console.log(
  "\n4. Generator is deterministic (two runs produce identical output)",
);
const first = readFileSync(modelPath, "utf8");
run("node scripts/generate-starter-model.mjs");
const second = readFileSync(modelPath, "utf8");
assert(first === second, "second run produces identical output");

// ─── Test 5: Diff on identical models produces no changes ───────────────────

console.log("\n5. Diff on identical models → no changes");
const copyPath = join(TMP, "model-copy.json");
writeFileSync(copyPath, readFileSync(modelPath));
run(`node scripts/diff-starter-model.mjs ${copyPath} ${modelPath}`);
const noChanges = JSON.parse(
  readFileSync(join(ROOT, "starter-changes.json"), "utf8"),
);
assert(!noChanges.version.changed, "version.changed is false");
assert(
  !noChanges.images.controlPlane.changed,
  "images.controlPlane.changed is false",
);
assert(
  !noChanges.images.dataPlane.changed,
  "images.dataPlane.changed is false",
);
assert(noChanges.skills.added.length === 0, "skills.added is empty");
assert(noChanges.skills.removed.length === 0, "skills.removed is empty");
assert(noChanges.skills.changed.length === 0, "skills.changed is empty");
assert(noChanges.fixtures.added.length === 0, "fixtures.added is empty");
assert(noChanges.fixtures.removed.length === 0, "fixtures.removed is empty");

const noChangesMd = readFileSync(join(ROOT, "starter-changes.md"), "utf8");
assert(noChangesMd.includes("No changes"), "markdown says 'No changes'");

// ─── Test 6: Diff detects version change ────────────────────────────────────

console.log("\n6. Diff detects version change");
const prevModel = JSON.parse(readFileSync(modelPath, "utf8"));
const nextModel = { ...prevModel, version: "99.99.99" };
const prevPath = join(TMP, "prev-model.json");
const nextPath = join(TMP, "next-model.json");
writeFileSync(prevPath, JSON.stringify(prevModel, null, 2) + "\n");
writeFileSync(nextPath, JSON.stringify(nextModel, null, 2) + "\n");
run(`node scripts/diff-starter-model.mjs ${prevPath} ${nextPath}`);
const versionDiff = JSON.parse(
  readFileSync(join(ROOT, "starter-changes.json"), "utf8"),
);
assert(versionDiff.version.changed, "version.changed is true");
assert(versionDiff.version.to === "99.99.99", "version.to is correct");
assert(
  versionDiff.from === prevModel.version,
  "diff.from matches prev version",
);
assert(versionDiff.to === "99.99.99", "diff.to matches next version");

const versionMd = readFileSync(join(ROOT, "starter-changes.md"), "utf8");
assert(versionMd.includes("99.99.99"), "markdown includes new version");

// ─── Test 7: Diff detects image change ──────────────────────────────────────

console.log("\n7. Diff detects image change");
const modelWithNewImage = {
  ...prevModel,
  images: {
    controlPlane: "ghcr.io/mardash-ai/forge-control-plane:9.9.9",
    dataPlane: prevModel.images.dataPlane,
  },
};
const newImagePath = join(TMP, "new-image-model.json");
writeFileSync(newImagePath, JSON.stringify(modelWithNewImage, null, 2) + "\n");
run(
  `node scripts/diff-starter-model.mjs ${prevPath.replace("prev-model", "prev-model")} ${newImagePath}`,
);

// Rewrite prev to original for this comparison
writeFileSync(prevPath, JSON.stringify(prevModel, null, 2) + "\n");
run(`node scripts/diff-starter-model.mjs ${prevPath} ${newImagePath}`);
const imageDiff = JSON.parse(
  readFileSync(join(ROOT, "starter-changes.json"), "utf8"),
);
assert(imageDiff.images.controlPlane.changed, "controlPlane change detected");
assert(!imageDiff.images.dataPlane.changed, "dataPlane unchanged");

// ─── Test 8: Diff output is stable (deterministic) ──────────────────────────

console.log("\n8. Diff output is stable across repeated runs");
run(`node scripts/diff-starter-model.mjs ${prevPath} ${nextPath}`);
const run1Json = readFileSync(join(ROOT, "starter-changes.json"), "utf8");
const run1Md = readFileSync(join(ROOT, "starter-changes.md"), "utf8");
run(`node scripts/diff-starter-model.mjs ${prevPath} ${nextPath}`);
const run2Json = readFileSync(join(ROOT, "starter-changes.json"), "utf8");
const run2Md = readFileSync(join(ROOT, "starter-changes.md"), "utf8");
assert(run1Json === run2Json, "starter-changes.json is identical across runs");
assert(run1Md === run2Md, "starter-changes.md is identical across runs");

// ─── Test 9: Diff handles minimal/empty previous model ───────────────────────

console.log("\n9. Diff handles minimal/empty previous model");
const emptyModel = {
  $schema: "https://forge.build/starter-model/v1",
  version: "none",
};
const emptyPath = join(TMP, "empty-model.json");
writeFileSync(emptyPath, JSON.stringify(emptyModel, null, 2) + "\n");
run(`node scripts/diff-starter-model.mjs ${emptyPath} ${modelPath}`);
const fromEmptyDiff = JSON.parse(
  readFileSync(join(ROOT, "starter-changes.json"), "utf8"),
);
assert(fromEmptyDiff.version.changed, "version change from empty detected");
assert(
  fromEmptyDiff.skills.added.length === model.skills.length,
  "all current skills appear as added",
);
assert(
  fromEmptyDiff.fixtures.added.length === model.fixtures.length,
  "all current fixtures appear as added",
);

// ─── Cleanup & Report ────────────────────────────────────────────────────────

cleanup();

const total = passed + failed;
console.log(`\n${total} assertions: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
