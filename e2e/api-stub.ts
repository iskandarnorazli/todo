// The app's network in e2e is fake and fixed (D12): JSONPlaceholder is replaced per test, so
// screenshots and flows never depend on the real service.
import type { Page, Route } from '@playwright/test';

export const TEN_TODOS = Array.from({ length: 10 }, (_, i) => ({
  userId: 1,
  id: i + 1,
  title: ['Buy groceries', 'Call the bank', 'Book flights', 'Pay the rent', 'Water the plants', 'Renew passport', 'Fix the bike', 'Read chapter 4', 'Email Aisyah', 'Back up laptop'][i]!,
  completed: i % 3 === 0,
}));

type Stub = { list?: 'ok' | 'empty' | 'error' | 'hang'; add?: 'ok' | 'error' | 'hang' };

export async function stubApi(page: Page, stub: Stub = {}): Promise<void> {
  const { list = 'ok', add = 'ok' } = stub;
  await page.route('**/jsonplaceholder.typicode.com/todos**', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      if (list === 'hang') return; // never answers: the loading state stays on screen
      if (list === 'error') return route.fulfill({ status: 500, body: 'error' });
      return route.fulfill({ json: list === 'empty' ? [] : TEN_TODOS });
    }
    if (add === 'hang') return;
    if (add === 'error') return route.fulfill({ status: 500, body: 'error' });
    const body = req.postDataJSON() as { title: string; completed: boolean; userId: number };
    return route.fulfill({ status: 201, json: { ...body, id: 201 } });
  });
}
