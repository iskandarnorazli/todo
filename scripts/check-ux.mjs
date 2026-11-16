// docs/UX_FLOWS.md and the e2e code describe the same screens and flows:
// - every Screens row has an entry in e2e/screens.ts with the same status, and the reverse;
// - every Flows row marked `enforced` has e2e/flows/<Flow>.spec.ts calling startFlow(page, '<Flow>');
// - every flow spec names a flow whose row is `enforced`;
// - every budget is a whole number.
// Run: node scripts/check-ux.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const doc = readFileSync(path.join(root, 'docs/UX_FLOWS.md'), 'utf8');
const problems = [];

function table(heading) {
  const start = doc.indexOf(`## ${heading}`);
  if (start < 0) return [];
  const rest = doc.slice(start).split('\n').slice(1);
  const rows = [];
  let seen = false;
  for (const line of rest) {
    if (line.startsWith('## ')) break;
    if (!line.startsWith('|')) {
      if (seen) break;
      continue;
    }
    seen = true;
    rows.push(line.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return rows.slice(2); // header and separator
}

const docScreens = new Map(table('Screens').map((r) => [r[0], r[3]]));
const src = readFileSync(path.join(root, 'e2e/screens.ts'), 'utf8');
const codeScreens = new Map([...src.matchAll(/id:\s*'([^']+)',\s*status:\s*'(built|planned)'/g)].map((m) => [m[1], m[2]]));
for (const [id, status] of docScreens) {
  if (!codeScreens.has(id)) problems.push(`screen ${id}: in docs/UX_FLOWS.md, missing from e2e/screens.ts`);
  else if (codeScreens.get(id) !== status) problems.push(`screen ${id}: doc says ${status}, e2e/screens.ts says ${codeScreens.get(id)}`);
}
for (const id of codeScreens.keys()) if (!docScreens.has(id)) problems.push(`screen ${id}: in e2e/screens.ts, missing from docs/UX_FLOWS.md`);
const builtWithoutOpen = [...src.matchAll(/id:\s*'([^']+)',\s*status:\s*'built'\s*}/g)].map((m) => m[1]);
for (const id of builtWithoutOpen) problems.push(`screen ${id}: built but has no open()`);

const flows = table('Flows');
const flowDir = path.join(root, 'e2e/flows');
const specIds = new Map();
for (const f of existsSync(flowDir) ? readdirSync(flowDir).filter((n) => n.endsWith('.spec.ts')) : []) {
  for (const m of readFileSync(path.join(flowDir, f), 'utf8').matchAll(/startFlow\(\s*page\s*,\s*'(F\d+)'/g)) specIds.set(m[1], f);
}
for (const [id, , , budget, status] of flows) {
  if (!/^\d+$/.test(budget)) problems.push(`flow ${id}: budget "${budget}" is not a whole number`);
  if (!['planned', 'enforced'].includes(status)) problems.push(`flow ${id}: status "${status}" is not planned or enforced`);
  if (status === 'enforced' && !specIds.has(id)) problems.push(`flow ${id}: enforced, but no e2e/flows/*.spec.ts calls startFlow(page, '${id}')`);
}
for (const [id, file] of specIds) {
  const row = flows.find((r) => r[0] === id);
  if (!row) problems.push(`flow ${id} (${file}): no row in docs/UX_FLOWS.md`);
  else if (row[4] !== 'enforced') problems.push(`flow ${id} (${file}): has a spec, so its status must be enforced`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`ux: ${docScreens.size} screen states and ${flows.length} flows match the e2e code`);
