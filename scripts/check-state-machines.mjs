// D19: every chart in docs/STATE_MACHINES.md and the transition table it names hold the same
// arrows, and every *_TRANSITIONS table in the source has a chart. Run:
//   node scripts/check-state-machines.mjs
// A heading names its table:  ## Upload (`src/todos/todosReducer.ts`, `SCREEN_TRANSITIONS`)
// Arrow labels: the event is the first UPPER_SNAKE word; "A / B" and "A or B" are two events.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const docPath = path.join(root, 'docs/STATE_MACHINES.md');
const doc = readFileSync(docPath, 'utf8');
const problems = [];

function chartArrows(block) {
  const arrows = new Set();
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(\w+)\s*-->\s*(\w+)\s*:\s*(.+)$/);
    if (!m) continue;
    const [, from, to, label] = m;
    for (const part of label.split(/\s+\/\s+|\s+or\s+/)) {
      const ev = part.match(/\b[A-Z][A-Z0-9_]+\b/);
      if (ev) arrows.add(`${from} --${ev[0]}--> ${to}`);
    }
  }
  return arrows;
}

function tableArrows(file, name) {
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf(`export const ${name}`);
  if (start < 0) return null;
  const body = src.slice(start, src.indexOf('];', start));
  const arrows = new Set();
  for (const m of body.matchAll(/from:\s*'(\w+)',\s*event:\s*'(\w+)',\s*to:\s*'(\w+)'/g)) {
    arrows.add(`${m[1]} --${m[2]}--> ${m[3]}`);
  }
  return arrows;
}

const charted = new Set();
const headingRe = /^##+ .*\(`([^`]+)`, `(\w+_TRANSITIONS)`\)\s*$/gm;
for (const h of doc.matchAll(headingRe)) {
  const [, rel, name] = h;
  charted.add(name);
  const after = doc.slice(h.index);
  const block = after.match(/```mermaid\n([\s\S]*?)```/);
  if (!block) {
    problems.push(`${name}: no mermaid chart under its heading`);
    continue;
  }
  const file = path.join(root, rel);
  if (!existsSync(file)) {
    problems.push(`${name}: ${rel} does not exist`);
    continue;
  }
  const inChart = chartArrows(block[1]);
  const inTable = tableArrows(file, name);
  if (!inTable) {
    problems.push(`${name}: not exported from ${rel}`);
    continue;
  }
  for (const a of inChart) if (!inTable.has(a)) problems.push(`${name}: chart has ${a}, table does not`);
  for (const a of inTable) if (!inChart.has(a)) problems.push(`${name}: table has ${a}, chart does not`);
}

const srcRoots = ['apps', 'src'].map((d) => path.join(root, d)).filter(existsSync);
function* sources(dir) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === 'dist') continue;
    const f = path.join(dir, n);
    if (statSync(f).isDirectory()) yield* sources(f);
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) yield f;
  }
}
for (const r of srcRoots) {
  for (const f of sources(r)) {
    for (const m of readFileSync(f, 'utf8').matchAll(/export const (\w+_TRANSITIONS)\b/g)) {
      if (!charted.has(m[1])) problems.push(`${m[1]} (${path.relative(root, f)}) has no chart in docs/STATE_MACHINES.md`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`state machines: ${charted.size} charts match their tables`);
