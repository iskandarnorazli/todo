import { expect, test } from '@playwright/test';
import { stubApi } from './api-stub';

test('the web render loads', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  await expect(page.getByText('Tasks').first()).toBeVisible();
});
