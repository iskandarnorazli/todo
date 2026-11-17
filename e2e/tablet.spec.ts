import { expect, test } from '@playwright/test';
import { stubApi } from './api-stub';

test('on an 820pt tablet viewport, content is at most 640pt wide and centered', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await stubApi(page);
  await page.goto('/');
  await page.getByText('Buy groceries').waitFor();

  const content = page.getByTestId('screen-content');
  const box = await content.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  expect(box.width).toBeLessThanOrEqual(640);
  const center = box.x + box.width / 2;
  expect(Math.abs(center - 410)).toBeLessThanOrEqual(2);
});
