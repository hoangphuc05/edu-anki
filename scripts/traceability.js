#!/usr/bin/env node
/**
 * Requirements ↔ Test Traceability checker.
 *
 * Reads docs/traceability-map.json (PRD FR-* -> test files) and verifies that:
 *   1. Every mapped test file exists in the repository.
 *   2. Every mapped test file actually contains at least one test case
 *      (a `test(` or `it(` call).
 *   3. Every FR-* requirement in the PRD has an entry in the map (coverage check).
 *
 * Usage:
 *   node scripts/traceability.js            # run checks and print a report
 *   node scripts/traceability.js --json     # machine-readable JSON output
 *
 * Exit code 0 on success, 1 if any requirement is unmapped or a mapped test
 * file is missing/empty.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MAP_PATH = path.join(ROOT, 'docs', 'traceability-map.json');
const PRD_PATH = path.join(ROOT, 'docs', 'Product_Requirements_Document.md');

const TEST_CALL_RE = /\b(test|it)\(/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Extract all FR-* requirement IDs from the PRD. */
function extractPrdRequirements(prdText) {
  const ids = new Set();
  const re = /\bFR-\d+\.\d+\.\d+\b/g;
  let m;
  while ((m = re.exec(prdText)) !== null) {
    ids.add(m[0]);
  }
  return [...ids].sort();
}

function fileHasTests(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return { exists: false, hasTests: false };
  const content = fs.readFileSync(abs, 'utf8');
  return { exists: true, hasTests: TEST_CALL_RE.test(content) };
}

function run() {
  const map = readJson(MAP_PATH);
  const prdText = fs.readFileSync(PRD_PATH, 'utf8');

  const prdRequirements = extractPrdRequirements(prdText);
  const mapped = Object.keys(map.requirements || {}).sort();

  const issues = [];
  const report = [];

  // 1 & 2: validate mapped test files exist and contain tests.
  for (const reqId of mapped) {
    const entry = map.requirements[reqId];
    const tests = entry.tests || [];
    for (const relPath of tests) {
      const { exists, hasTests } = fileHasTests(relPath);
      if (!exists) {
        issues.push(`[${reqId}] mapped test file does not exist: ${relPath}`);
      } else if (!hasTests) {
        issues.push(`[${reqId}] mapped test file contains no test cases: ${relPath}`);
      }
    }
    report.push({ requirement: reqId, capability: entry.capability, tests });
  }

  // 3: every PRD requirement must be mapped.
  const unmapped = prdRequirements.filter((id) => !mapped.includes(id));
  for (const id of unmapped) {
    issues.push(`[${id}] requirement in PRD has no entry in traceability-map.json`);
  }

  // Requirements in the map that are not in the PRD (stale entries).
  const stale = mapped.filter((id) => !prdRequirements.includes(id));
  for (const id of stale) {
    issues.push(`[${id}] mapped in traceability-map.json but not found in PRD`);
  }

  const summary = {
    prdRequirements: prdRequirements.length,
    mappedRequirements: mapped.length,
    unmappedRequirements: unmapped.length,
    staleEntries: stale.length,
    testFileIssues: issues.filter((i) => !i.startsWith('[') || i.includes('test file')).length,
    ok: issues.length === 0,
  };

  const output = { summary, issues, report };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('=== Requirements ↔ Test Traceability ===\n');
    for (const r of report) {
      const tests = r.tests.length ? r.tests.join(', ') : '(no automated test mapped)';
      console.log(`${r.requirement} [${r.capability}] -> ${tests}`);
    }
    console.log(`\nPRD requirements: ${summary.prdRequirements}`);
    console.log(`Mapped requirements: ${summary.mappedRequirements}`);
    console.log(`Unmapped: ${summary.unmappedRequirements}`);
    console.log(`Stale entries: ${summary.staleEntries}`);
    if (issues.length) {
      console.log('\nISSUES:');
      for (const i of issues) console.log(`  - ${i}`);
    }
    console.log(summary.ok ? '\nRESULT: PASS' : '\nRESULT: FAIL');
  }

  process.exit(summary.ok ? 0 : 1);
}

run();
