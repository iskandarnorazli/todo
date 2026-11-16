// Captures every built screen state at each viewport into SNAP_DIR/screens/
// (<state>--<viewport>.png). Run: SNAP_DIR=snapshots npm run snapshots
import path from 'node:path';
import { test } from '@playwright/test';
import { SCREENS } from './screens';
import { SNAP_DIR, VIEWPORTS, wanted } from './ux';

for (const screen of SCREENS.filter((s) => s.status === 'built' && wanted(s.id))) {
  for (const vp of VIEWPORTS) {
    test(`${screen.id} @${vp.name}`, async ({ page }) => {
      test.skip(!SNAP_DIR, 'SNAP_DIR is not set: nothing to write');
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await screen.open!(page);
      await page.screenshot({
        path: path.join(SNAP_DIR!, 'screens', `${screen.id}--${vp.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
