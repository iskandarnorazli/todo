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
      await page.getByText('No tasks left. Add one above.').first().waitFor();
    },
  },
  {
    id: 'S1.invalid',
    status: 'built',
    open: async (page) => {
      await stubApi(page);
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
      await page.getByRole('button', { name: 'Add' }).click();
      await page.getByText('Enter a task title.').waitFor();
    },
  },
  {
    id: 'S1.saving',
    status: 'built',
    open: async (page) => {
      await stubApi(page, { add: 'hang' });
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
      await page.getByPlaceholder('Add a task...').fill('New task');
      await page.getByRole('button', { name: 'Add' }).click();
      await page.getByText('Adding...').waitFor();
    },
  },
  {
    id: 'S1.addError',
    status: 'built',
    open: async (page) => {
      await stubApi(page, { add: 'error' });
      await page.goto('/');
      await page.getByText('Buy groceries').first().waitFor();
      await page.getByPlaceholder('Add a task...').fill('New task');
      await page.getByRole('button', { name: 'Add' }).click();
      await page.getByText("Couldn't add the task.").first().waitFor();
    },
  },
  { id: 'S1.reloadConfirm', status: 'planned' },
];
