import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F1: See the first ten tasks', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  const flow = startFlow(page, 'F1');
  await expect(page.getByText('Buy groceries')).toBeVisible();
  await expect(page.getByText('Back up laptop')).toBeVisible();
  await flow.done();
});
