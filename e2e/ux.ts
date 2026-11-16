// Shared by the snapshot spec and the flow specs. Screenshots are the react-native-web render
// (D15), labelled as such; native screenshots come from Expo Go in the PR. docs/UX_FLOWS.md is the source of the
// budgets; this file reads it, so the owner edits one place.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
] as const;

/** Where screenshots go. Unset: nowhere (plain e2e runs take no screenshots). */
export const SNAP_DIR = process.env.SNAP_DIR ? path.resolve(process.env.SNAP_DIR) : null;

/** SNAP_ONLY=S3.markers,F3 limits a capture run to those ids. Empty means everything built. */
export const SNAP_ONLY = (process.env.SNAP_ONLY ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function wanted(id: string): boolean {
  return SNAP_ONLY.length === 0 || SNAP_ONLY.some((o) => id === o || id.startsWith(`${o}.`));
}

// Playwright runs from the repository root (where playwright.config.ts is).
const doc = () => readFileSync(path.resolve(process.cwd(), 'docs/UX_FLOWS.md'), 'utf8');

/** The Budget column of the flow's row in docs/UX_FLOWS.md. */
export function budgetOf(flowId: string): number {
  const row = doc()
    .split('\n')
    .find((l) => l.startsWith(`| ${flowId} |`));
  const cells = row?.split('|').map((c) => c.trim());
  const budget = Number(cells?.[4]);
  if (!row || !Number.isInteger(budget)) throw new Error(`docs/UX_FLOWS.md has no budget for ${flowId}`);
  return budget;
}
