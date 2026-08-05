#!/usr/bin/env node
/**
 * Appends a new release row to docs/BASELINE_INVENTORY.md and refreshes the
 * "Working baseline" row, so the inventory stays in sync with the tags/releases
 * that CI creates automatically instead of relying on a manual edit each time.
 *
 * Invoked by the `release` job in .github/workflows/ci.yml after a new tag is
 * pushed.
 *
 * Usage: node scripts/update_baseline_inventory.js <tag> <shortSha> [date]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(ROOT, 'docs', 'BASELINE_INVENTORY.md');

const [tag, sha] = process.argv.slice(2);
const date = process.argv[4] || new Date().toISOString().slice(0, 10);

if (!tag || !sha) {
  console.error('Usage: node scripts/update_baseline_inventory.js <tag> <shortSha> [date]');
  process.exit(1);
}

let content = fs.readFileSync(INVENTORY_PATH, 'utf8');

if (content.includes(`| ${tag} |`)) {
  console.log(`Baseline ${tag} already recorded, skipping.`);
  process.exit(0);
}

const scope = `See GitHub Release notes for ${tag}`;
const newRow = `| ${tag} | \`${tag}\` | \`${sha}\` | ${date} | ${scope} | Released |\n`;

const workingBaselineRe = /\| Working baseline \|.*\|\n/;
if (!workingBaselineRe.test(content)) {
  console.error('Could not find the "Working baseline" row in docs/BASELINE_INVENTORY.md');
  process.exit(1);
}
content = content.replace(
  workingBaselineRe,
  `${newRow}| Working baseline | \`main\` | \`${sha}\` (HEAD) | ${date} | Latest merged code on \`main\` | Active |\n`
);

const revisionHeaderRe = /(\| Version \| Date \| Summary of Changes \|\n\|---\|---\|---\|\n)/;
const versions = [...content.matchAll(/\| (\d+\.\d+) \|/g)].map((m) => parseFloat(m[1]));
const nextVersion = versions.length ? (Math.max(...versions) + 0.1).toFixed(1) : '1.1';
const revisionRow = `| ${nextVersion} | ${date} | Automated: recorded baseline ${tag} via CI release workflow. |\n`;
content = content.replace(revisionHeaderRe, `$1${revisionRow}`);

fs.writeFileSync(INVENTORY_PATH, content);
console.log(`Recorded baseline ${tag} (${sha}) in docs/BASELINE_INVENTORY.md`);
