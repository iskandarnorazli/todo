import { expect, test } from '@playwright/test';
import { stubApi } from '../api-stub';
import { startFlow } from './flow';

test('F5: Recover from a failed load', async ({ page }) => {
  await stubApi(page, { list: 'error' });
  await page.goto('/');
  await page.getByText("Couldn't load tasks.").waitFor();

  await page.unroute('**/jsonplaceholder.typicode.com/todos**');
  await stubApi(page, { list: 'ok' });

  const flow = startFlow(page, 'F5');
  await flow.step('tap Retry', () => page.getByRole('button', { name: 'Retry' }).click());
  await expect(page.getByText('Buy groceries')).toBeVisible();

  await flow.done();
});
