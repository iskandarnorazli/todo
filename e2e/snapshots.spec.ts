// Captures every built screen state at each viewport into SNAP_DIR/screens/
// (<state>--<viewport>.png); SNAP_DIR defaults to ./snapshots. Run: npm run snapshots
import path from 'node:path';
import { test } from '@playwright/test';
import { SCREENS } from './screens';
import { SNAP_DIR, VIEWPORTS, wanted } from './ux';

const outDir = SNAP_DIR ?? path.resolve('snapshots');

for (const screen of SCREENS.filter((s) => s.status === 'built' && wanted(s.id))) {
  for (const vp of VIEWPORTS) {
    test(`${screen.id} @${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await screen.open!(page);
      await page.screenshot({
        path: path.join(outDir, 'screens', `${screen.id}--${vp.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
