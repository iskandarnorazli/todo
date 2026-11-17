import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F3: Mark a task done, then not done', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  await page.getByText('Call the bank').waitFor();

  const flow = startFlow(page, 'F3');
  const checkbox = page.getByRole('checkbox', { name: 'Call the bank' });
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');

  await flow.step('mark task done', () => checkbox.click());
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');

  await flow.step('mark task not done', () => checkbox.click());
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');

  await flow.done();
});
