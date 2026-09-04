#!/usr/bin/env node
// scripts/generate-starter-model.mjs
// Reads the repo and writes starter-model.json — plain Node, no install required.

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Extract pinned control-plane and data-plane images from compose.yaml. */
function parseComposeImages(yaml) {
  const images = { controlPlane: null, dataPlane: null };
  for (const line of yaml.split("\n")) {
    const cp = line.match(
      /^\s+image:\s+(ghcr\.io\/mardash-ai\/forge-control-plane:\S+)/,
    );
    if (cp) images.controlPlane = cp[1].trim();
    const dp = line.match(/FORGE_DATA_PLANE_IMAGE=(\S+)/);
    if (dp) images.dataPlane = dp[1].trim();
  }
  return images;
}

/** Parse YAML frontmatter (key: value lines between --- delimiters). */
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

/**
 * Parse the capability→./forge mapping table from a skill file.
 * Collects the first ./forge <verb> occurrence for each unique verb,
 * from code-block lines and inline backtick references.
 */
function parseForgeMapping(content) {
  const mappings = [];
  const seen = new Set();

  // Code-block lines: lines that begin with ./forge <verb>
  const blockRe = /^\s*\.\/forge\s+(\w+)([ \t][^\n]*)?/gm;
  // Inline code: `./forge <verb> ...`
  const inlineRe = /`\.\/forge\s+(\w+)([^`]*)`/g;

  for (const re of [blockRe, inlineRe]) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const verb = m[1];
      if (verb.startsWith("-") || seen.has(verb)) continue;
      seen.add(verb);
      // Strip trailing inline comments and excess whitespace
      const rest = (m[2] ?? "").replace(/#.*$/, "").trim().replace(/\s+/g, " ");
      const cmd = rest ? `./forge ${verb} ${rest}` : `./forge ${verb}`;
      mappings.push({ capability: verb, command: cmd });
    }
  }

  // Sort by capability name for deterministic output
  return mappings.sort((a, b) => a.capability.localeCompare(b.capability));
}

/** Extract the 'one rule' block from CLAUDE.md. */
function extractOneRuleBlock(content) {
  const m = content.match(/## The one rule\n\n([\s\S]*?)(?=\n## |\n# |$)/);
  return m ? m[1].trim() : "";
}

/** Scan fixtures/* directories and extract scenario keys from hops.json. */
function parseFixtures(fixturesDir) {
  const fixtures = [];
  if (!existsSync(fixturesDir)) return fixtures;
  for (const name of readdirSync(fixturesDir).sort()) {
    const fp = join(fixturesDir, name);
    if (!statSync(fp).isDirectory()) continue;
    const fixture = { scenario: name, scenarioKeys: [], files: [] };
    const hopsPath = join(fp, "hops.json");
    if (existsSync(hopsPath)) {
      const hops = JSON.parse(readFileSync(hopsPath, "utf8"));
      fixture.scenarioKeys = (hops.hops ?? [])
        .map((h) => h.label)
        .filter(Boolean);
    }
    fixture.files = readdirSync(fp).sort();
    fixtures.push(fixture);
  }
  return fixtures;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = pkg.version;

const composeYaml = readFileSync(join(ROOT, "compose.yaml"), "utf8");
const images = parseComposeImages(composeYaml);

const claudeMd = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
const oneRuleContract = extractOneRuleBlock(claudeMd);

// Parse all skills under .claude/skills/*/SKILL.md
const skillsDir = join(ROOT, ".claude", "skills");
const skills = [];
for (const skillName of readdirSync(skillsDir).sort()) {
  const skillPath = join(skillsDir, skillName, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  const content = readFileSync(skillPath, "utf8");
  const fm = parseFrontmatter(content);
  skills.push({
    name: fm.name ?? skillName,
    description: fm.description ?? "",
    forgeMapping: parseForgeMapping(content),
  });
}

const fixtures = parseFixtures(join(ROOT, "fixtures"));

const model = {
  $schema: "https://forge.build/starter-model/v1",
  version,
  images,
  skills,
  oneRuleContract,
  fixtures,
};

const outPath = join(ROOT, "starter-model.json");
writeFileSync(outPath, JSON.stringify(model, null, 2) + "\n");
console.log(`Generated starter-model.json (version ${version})`);
