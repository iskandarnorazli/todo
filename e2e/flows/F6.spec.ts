import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F6: Reload the list from the server', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  await page.getByText('Buy groceries').waitFor();

  await page.getByLabel('Delete Buy groceries').click();
  await expect(page.getByText('Buy groceries')).toHaveCount(0);

  const flow = startFlow(page, 'F6');
  await flow.step('tap Reload', () => page.getByRole('button', { name: 'Reload' }).click());
  await flow.step('confirm reload', () =>
    page.getByRole('button', { name: 'Confirm reload' }).click(),
  );

  await expect(page.getByText('Buy groceries')).toBeVisible();
  await flow.done();
});
