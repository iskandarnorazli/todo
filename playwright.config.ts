import { defineConfig } from '@playwright/test';

// The app as react-native-web (D15), exported and served statically; the API is stubbed per
// test (e2e/api-stub.ts). Two projects:
// - e2e: behaviour, including the flow specs that enforce the step budgets of docs/UX_FLOWS.md
// - snapshots: one screenshot per built screen state (e2e/screens.ts) per viewport
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:8081', trace: 'retain-on-failure' },
  projects: [
    { name: 'e2e', testIgnore: /snapshots\.spec\.ts/ },
    { name: 'snapshots', testMatch: /snapshots\.spec\.ts/ },
  ],
  webServer: {
    command: 'npm run web:build && node scripts/serve-static.mjs dist-web 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
