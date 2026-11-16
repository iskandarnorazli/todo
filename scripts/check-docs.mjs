// Every relative Markdown link in the docs and agent files points at a file that exists, and
// no link is an absolute machine path (C:\..., /home/...). Run: node scripts/check-docs.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['node_modules', '.git', 'dist', 'state']);

function* markdownFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* markdownFiles(full);
    else if (name.endsWith('.md')) yield full;
  }
}

const problems = [];
for (const file of markdownFiles(root)) {
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
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('docs: links ok');
