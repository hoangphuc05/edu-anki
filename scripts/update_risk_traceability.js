#!/usr/bin/env node
/**
 * One-time helper: adds a "Verifying Test(s)" column to docs/risk_management.csv.
 * Each row is a single line; we append the new column at the end of each line,
 * so the internal quoted fields are left untouched.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '..', 'docs', 'risk_management.csv');

// Risk number -> verifying test file(s). Risks 12-15 (CSV import/export) are
// documented/planned and have no automated test yet.
const TEST_MAP = {
  1: 'server/__tests__/schema.test.js',
  2: 'server/__tests__/auth.test.js',
  3: 'server/__tests__/auth.test.js',
  4: 'packages/srs-engine/__tests__/scheduler.test.js; server/__tests__/study.test.js',
  5: 'server/__tests__/schema.test.js; server/__tests__/decks.test.js',
  6: 'server/__tests__/validate.test.js; server/__tests__/decks.test.js; server/__tests__/cards.test.js',
  7: 'server/__tests__/study.test.js',
  8: 'server/__tests__/study.test.js',
  9: 'webapp/src/__tests__/StudyRoute.test.tsx',
  10: 'webapp/src/__tests__/StudyRoute.test.tsx',
  11: 'webapp/src/__tests__/DecksRoute.test.tsx; webapp/src/__tests__/DeckDetailRoute.test.tsx',
  12: '(not implemented)',
  13: '(not implemented)',
  14: '(not implemented)',
  15: '(not implemented)',
  16: 'server/__tests__/*; webapp/src/__tests__/*; packages/srs-engine/__tests__/*',
  17: '.github/workflows/ci.yml',
  18: '.github/workflows/ci.yml',
};

const lines = fs.readFileSync(CSV_PATH, 'utf8').split('\n').filter((l) => l.trim() !== '');

const header = lines[0] + ',Verifying Test(s)';
const rows = lines.slice(1).map((line) => {
  const num = parseInt(line.split(',')[0], 10);
  const tests = TEST_MAP[num] ?? '(unmapped)';
  return line + ',' + tests;
});

fs.writeFileSync(CSV_PATH, [header, ...rows].join('\n') + '\n', 'utf8');
console.log(`Updated ${CSV_PATH}: added Verifying Test(s) column to ${rows.length} risk rows.`);
