// Every relative Markdown link in the docs and agent files points at a file that exists, and
// no link is an absolute machine path (C:\..., /home/...). Also checks that every Proof cell in
// docs/REQUIREMENTS.md names at least one existing test file. Run: node scripts/check-docs.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['node_modules', '.git', 'dist', 'state']);

function* allFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* allFiles(full);
    else yield full;
  }
}

const problems = [];
const testFiles = new Set();

for (const file of allFiles(root)) {
  if (/\.test\.(ts|tsx)$/.test(file)) {
    testFiles.add(path.basename(file));
  }
  if (!file.endsWith('.md')) continue;
  const text = readFileSync(file, 'utf8');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const rel = path.relative(root, file);
    if (/^([a-zA-Z]:[\\/]|\/)/.test(target)) {
      problems.push(`${rel}: absolute path link ${target}`);
      continue;
    }
    const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
    if (!existsSync(resolved)) problems.push(`${rel}: broken link ${target}`);
  }
}

const reqPath = path.join(root, 'docs', 'REQUIREMENTS.md');
const reqLines = readFileSync(reqPath, 'utf8').split(/\r?\n/);
for (const line of reqLines) {
  if (!/^\| T\d+ \|/.test(line)) continue;
  const cells = line.split('|').map((c) => c.trim());
  const id = cells[1];
  const proof = cells[4];
  if (cells.length < 6 || !proof) continue;
  const named = [...proof.matchAll(/`([^`]+\.test\.tsx?)`/g)].map((m) => m[1]);
  if (named.length === 0) {
    problems.push(`docs/REQUIREMENTS.md: ${id} has no test file in Proof (${proof})`);
    continue;
  }
  for (const name of named) {
    if (!testFiles.has(name)) {
      problems.push(`docs/REQUIREMENTS.md: ${id} names missing proof file ${name}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('docs: links ok');
