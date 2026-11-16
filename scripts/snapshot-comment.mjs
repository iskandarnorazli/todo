// Builds the "UI snapshots" comment from a checkout of the ui-snapshots branch.
//   node scripts/snapshot-comment.mjs <snapshots checkout> <dest dir> <before dir> > comment.md
// <dest dir> holds this run's screens/ and flows/; <before dir> (main/latest) the same for main.
// Screens whose bytes differ from main come first; unchanged ones fold into a <details>.
// Env: GITHUB_REPOSITORY (owner/repo), SNAP_TITLE (first line), SNAP_SHA (commit shown).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [root, dest, before] = process.argv.slice(2);
if (!root || !dest || !before) {
  console.error('usage: snapshot-comment.mjs <checkout> <dest> <before>');
  process.exit(2);
}
const repo = process.env.GITHUB_REPOSITORY ?? 'owner/repo';
const raw = (p) => `https://raw.githubusercontent.com/${repo}/ui-snapshots/${p}`;
const img = (p, w) => `<img src="${raw(p)}" width="${w}">`;
const list = (dir) => (existsSync(path.join(root, dir)) ? readdirSync(path.join(root, dir)).sort() : []);
const same = (a, b) =>
  existsSync(path.join(root, a)) && existsSync(path.join(root, b)) &&
  readFileSync(path.join(root, a)).equals(readFileSync(path.join(root, b)));

const files = list(`${dest}/screens`);
const states = [...new Set(files.map((f) => f.split('--')[0]))];
const viewports = [...new Set(files.map((f) => f.split('--')[1]?.replace(/\.png$/, '')).filter(Boolean))];
const width = (vp) => (vp === 'phone' ? 160 : 360);
const cell = (state, vp, side) => {
  const p = `${side === 'after' ? dest : before}/screens/${state}--${vp}.png`;
  return existsSync(path.join(root, p)) ? img(p, width(vp)) : '(none)';
};
const row = (s) => `| \`${s}\` | ${viewports.flatMap((vp) => [cell(s, vp, 'before'), cell(s, vp, 'after')]).join(' | ')} |`;
const head = `| State | ${viewports.flatMap((vp) => [`${vp}, main`, `${vp}, this run`]).join(' | ')} |\n|---|${viewports.map(() => '---|---|').join('')}`;
const unchanged = (s) => viewports.every((vp) => same(`${dest}/screens/${s}--${vp}.png`, `${before}/screens/${s}--${vp}.png`));
const changed = states.filter((s) => !unchanged(s));
const kept = states.filter(unchanged);

const out = ['<!-- ui-snapshots -->', `## ${process.env.SNAP_TITLE ?? 'UI snapshots'}`, ''];
out.push(`Commit \`${(process.env.SNAP_SHA ?? '').slice(0, 7)}\`. [All files](https://github.com/${repo}/tree/ui-snapshots/${dest}). State and flow ids are in [docs/UX_FLOWS.md](https://github.com/${repo}/blob/main/docs/UX_FLOWS.md). Comment here to review.`, '');
out.push(`### Screens: ${changed.length} changed, ${kept.length} unchanged`, '');
if (changed.length) out.push(head, ...changed.map(row), '');
if (kept.length) out.push('<details><summary>Unchanged</summary>', '', head, ...kept.map(row), '', '</details>', '');
if (!states.length) out.push('No built screen states yet.', '');

const flows = list(`${dest}/flows`);
if (flows.length) {
  out.push('### Flows (one image per step)', '');
  for (const f of flows) {
    const steps = list(`${dest}/flows/${f}`);
    out.push(`**${f}**: ${steps.length} steps`, '', steps.map((s) => img(`${dest}/flows/${f}/${s}`, 220)).join(' '), '', steps.map((s, i) => `${i + 1}. ${s.replace(/^\d+-|\.png$/g, '').replace(/-/g, ' ')}`).join('\n'), '');
  }
}
process.stdout.write(out.join('\n'));
