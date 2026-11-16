// A flow spec counts the user's steps (docs/UX_FLOWS.md, "What counts as a step") and fails
// when they exceed the flow's budget in that file. With SNAP_DIR set, it also saves a
// screenshot after each step: SNAP_DIR/flows/<Flow>/<nn>-<label>.png, the PR's filmstrip.
//
//   const flow = startFlow(page, 'F3');
//   await flow.step('fill the name', () => page.getByLabel('Name').fill('Suria KLCC'));
//   ...
//   await flow.done();
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { budgetOf, SNAP_DIR, wanted } from '../ux';

export function startFlow(page: Page, flowId: string) {
  const budget = budgetOf(flowId);
  const labels: string[] = [];
  const shoot = SNAP_DIR !== null && wanted(flowId);
  return {
    async step(label: string, action: () => Promise<unknown>): Promise<void> {
      await action();
      labels.push(label);
      if (shoot) {
        const name = `${String(labels.length).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
        await page.screenshot({ path: path.join(SNAP_DIR!, 'flows', flowId, name), animations: 'disabled' });
      }
    },
    async done(): Promise<void> {
      expect(labels.length, `${flowId} took ${labels.length} steps (${labels.join(', ')}); budget ${budget}`).toBeLessThanOrEqual(budget);
    },
  };
}
