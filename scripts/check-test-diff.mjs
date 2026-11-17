// The test-guard (changing-behaviour skill): flags changes that can weaken the tests, so they need
// the owner's `test-change-approved` label. Compares the working tree with the merge base of a ref.
//   node scripts/check-test-diff.mjs [base ref, default origin/main]
// Exit 1 when something is flagged, unless TEST_CHANGE_APPROVED=true (set by CI from the label).
//
// Flagged:
// - a removed line in a test file that holds an assertion or a test, unless the same line is
//   added back anywhere in the diff (a moved or reformatted test keeps its lines);
// - an added skip/only/todo/fixme/xit/xdescribe in a test file;
// - a property test whose numRuns went down;
// - a removed transition-table row (from: 'a', event: 'B', to: 'c') not added back;
// - in docs/UX_FLOWS.md: a raised step budget, a removed flow row, a removed screen-state row.
// Loose matchers added (toBeTruthy, toBeDefined, expect.anything, toMatchObject) are reported as
// warnings: fine in a new test, a weakening when they replace a strict one.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const baseRef = process.argv[2] ?? 'origin/main';
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const base = git('merge-base', baseRef, 'HEAD').trim();

const isTest = (p) => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(p) || /(^|\/)(test|testing)\/.+\.(ts|tsx)$/.test(p);
const ASSERT = /\b(expect|assert|expectBody|checkMachine|startFlow|fc\.assert|it|test|describe)\s*[(.]|\.(toBe|toEqual|toStrictEqual|toThrow|toMatch|toContain|toHaveLength|toBeLessThanOrEqual|done)\s*\(/;
const SKIP = /(\.(skip|only|todo|fixme)\s*\()|\b(xit|xdescribe|xtest)\s*\(/;
const LOOSE = /\.(toBeTruthy|toBeDefined|toMatchObject)\s*\(|expect\.anything\(\)/;
const ROW = /from:\s*'\w+',\s*event:\s*'\w+',\s*to:\s*'\w+'/;

const removed = [];
const added = [];
let file = null;
let oldLine = 0;
let newLine = 0;
for (const line of git('diff', '--unified=0', '--no-color', base, '--').split('\n')) {
  const header = line.match(/^diff --git a\/(.+) b\/(.+)$/);
  if (header) {
    file = header[2];
    continue;
  }
  const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  if (hunk) {
    oldLine = Number(hunk[1]);
    newLine = Number(hunk[2]);
    continue;
  }
  if (line.startsWith('---') || line.startsWith('+++')) continue;
  if (line.startsWith('-')) removed.push({ file, line: oldLine++, text: line.slice(1).trim() });
  else if (line.startsWith('+')) added.push({ file, line: newLine++, text: line.slice(1).trim() });
}

// New files not yet staged are not in `git diff`; count their lines as added (local runs).
for (const f of git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean)) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((text, i) => added.push({ file: f, line: i + 1, text: text.trim() }));
}

const addedTexts = new Set(added.map((a) => a.text));
const flags = [];
const warnings = [];

for (const r of removed) {
  if (!r.text || addedTexts.has(r.text)) continue;
  if (isTest(r.file) && ASSERT.test(r.text)) flags.push(`${r.file}:${r.line} (base) removed or changed: ${r.text}`);
  if (ROW.test(r.text)) flags.push(`${r.file}:${r.line} (base) transition row removed: ${r.text}`);
}
for (const a of added) {
  if (!isTest(a.file)) continue;
  if (SKIP.test(a.text)) flags.push(`${a.file}:${a.line} skip/only added: ${a.text}`);
  // `expect(getBy...(...)).toBeTruthy()` is strict: getBy* throws when nothing matches.
  if (LOOSE.test(a.text) && !/\b(getBy|getAllBy)\w*\(/.test(a.text)) {
    warnings.push(`${a.file}:${a.line} loose matcher: ${a.text}`);
  }
}
const runs = (list, f) => list.filter((x) => x.file === f).map((x) => x.text.match(/numRuns:\s*(\d+)/)?.[1]).filter(Boolean).map(Number);
for (const f of new Set(removed.map((r) => r.file))) {
  const before = runs(removed, f);
  const after = runs(added, f);
  if (before.length && after.length && Math.min(...after) < Math.min(...before)) {
    flags.push(`${f}: numRuns lowered from ${Math.min(...before)} to ${Math.min(...after)}`);
  }
}

function uxTables(text) {
  const rows = new Map();
  for (const l of text.split('\n')) {
    const c = l.split('|').map((s) => s.trim());
    if (/^F\d+$/.test(c[1] ?? '')) rows.set(c[1], { kind: 'flow', budget: Number(c[4]) });
    else if (/^S\d+\.\w+$/.test(c[1] ?? '')) rows.set(c[1], { kind: 'screen' });
  }
  return rows;
}
const uxPath = 'docs/UX_FLOWS.md';
let baseUx = null;
try {
  baseUx = git('show', `${base}:${uxPath}`);
} catch {
  baseUx = null;
}
if (baseUx && existsSync(uxPath)) {
  const before = uxTables(baseUx);
  const after = uxTables(readFileSync(uxPath, 'utf8'));
  for (const [id, b] of before) {
    const a = after.get(id);
    if (!a) flags.push(`${uxPath}: ${b.kind} ${id} removed`);
    else if (b.kind === 'flow' && a.budget > b.budget) flags.push(`${uxPath}: ${id} budget raised from ${b.budget} to ${a.budget}`);
  }
}

for (const w of warnings) console.log(`warning: ${w}`);
if (!flags.length) {
  console.log(`test-guard: nothing that weakens the tests (base ${base.slice(0, 7)})`);
  process.exit(0);
}
console.log(`test-guard: ${flags.length} change(s) need the owner's test-change-approved label (changing-behaviour skill):`);
for (const f of flags) console.log(`  ${f}`);
if (process.env.TEST_CHANGE_APPROVED === 'true') {
  console.log('Approved by the test-change-approved label.');
  process.exit(0);
}
process.exit(1);
