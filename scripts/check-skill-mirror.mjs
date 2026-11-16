// .agents/skills (read by Antigravity) and .claude/skills (read by Claude Code) hold the same
// files with the same bytes. Edit .agents/skills, then copy. Run: node scripts/check-skill-mirror.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const a = path.join(root, '.agents/skills');
const b = path.join(root, '.claude/skills');

function list(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? list(full, base) : [path.relative(base, full)];
  });
}

const files = new Set([...list(a), ...list(b)]);
const problems = [];
for (const f of [...files].sort()) {
  const pa = path.join(a, f);
  const pb = path.join(b, f);
  if (!existsSync(pa)) problems.push(`only in .claude/skills: ${f}`);
  else if (!existsSync(pb)) problems.push(`only in .agents/skills: ${f}`);
  else if (!readFileSync(pa).equals(readFileSync(pb))) problems.push(`differs: ${f}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`skills: ${files.size} files mirrored`);
