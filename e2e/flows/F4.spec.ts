import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F4: Delete a task', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  await page.getByText('Buy groceries').waitFor();

  const flow = startFlow(page, 'F4');
  await flow.step('delete task', () => page.getByLabel('Delete Buy groceries').click());
  await expect(page.getByText('Buy groceries')).toHaveCount(0);

  await flow.done();
});
