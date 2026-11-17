// One entry per row of the Screens table in docs/UX_FLOWS.md (check-ux.mjs keeps them equal).
// A built state has `open`, which brings a fresh page to exactly that state with stubbed data.
import type { Page } from '@playwright/test';
import { stubApi } from './api-stub';

export type ScreenState = {
  id: string;
  status: 'built' | 'planned';
  open?: (page: Page) => Promise<void>;
};

export const SCREENS: ScreenState[] = [
  {
    id: 'S0.home',
    status: 'built',
    open: async (page) => {
      await stubApi(page);
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
    },
  },
  { id: 'S1.loading', status: 'planned' },
  { id: 'S1.list', status: 'planned' },
  { id: 'S1.error', status: 'planned' },
  { id: 'S1.empty', status: 'planned' },
  { id: 'S1.invalid', status: 'planned' },
  { id: 'S1.saving', status: 'planned' },
  { id: 'S1.addError', status: 'planned' },
  { id: 'S1.reloadConfirm', status: 'planned' },
];
