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
    id: 'S1.loading',
    status: 'built',
    open: async (page) => {
      await stubApi(page, { list: 'hang' });
      await page.goto('/');
      await page.getByText('Loading tasks...').waitFor();
    },
  },
  {
    id: 'S1.list',
    status: 'built',
    open: async (page) => {
      await stubApi(page);
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
    },
  },
  {
    id: 'S1.error',
    status: 'built',
    open: async (page) => {
      await stubApi(page, { list: 'error' });
      await page.goto('/');
      await page.getByText("Couldn't load tasks.").first().waitFor();
    },
  },
  {
    id: 'S1.empty',
    status: 'built',
    open: async (page) => {
      await stubApi(page, { list: 'empty' });
      await page.goto('/');
      await page.getByText('No tasks yet.').first().waitFor();
    },
  },
  { id: 'S1.invalid', status: 'planned' },
  { id: 'S1.saving', status: 'planned' },
  { id: 'S1.addError', status: 'planned' },
  {
    id: 'S1.reloadConfirm',
    status: 'built',
    open: async (page) => {
      await stubApi(page);
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
      await page.getByRole('button', { name: 'Reload' }).click();
      await page.getByText('Reload from server?').waitFor();
    },
  },
];
