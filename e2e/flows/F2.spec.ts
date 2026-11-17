import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F2: Add a task', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  await page.getByText('Buy groceries').waitFor();

  const flow = startFlow(page, 'F2');
  await flow.step('fill title', () => page.getByPlaceholder('Add a task...').fill('Buy milk'));
  await flow.step('tap Add', () => page.getByRole('button', { name: 'Add' }).click());

  await expect(page.getByText('Buy milk')).toBeVisible();
  await flow.done();
});
