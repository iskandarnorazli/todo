// The only code that calls fetch (lint, D4). Issue #2 fills the bodies.
import { ApiError, type Todo } from './types';

export const API_BASE = 'https://jsonplaceholder.typicode.com';
export const TIMEOUT_MS = 10_000;
export const USER_ID = 1;

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === 'number' &&
    typeof record.id === 'number' &&
    typeof record.title === 'string' &&
    typeof record.completed === 'boolean'
  );
}

function isTodoArray(value: unknown): value is Todo[] {
  return Array.isArray(value) && value.every(isTodo);
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  guard: (value: unknown) => value is T,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new ApiError('timeout', `Request timed out after ${TIMEOUT_MS}ms`);
    }
    throw new ApiError('network', 'Network request failed');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError('http', `HTTP ${response.status}`, response.status);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('shape', 'Invalid JSON response');
  }

  if (!guard(data)) {
    throw new ApiError('shape', 'Unexpected response shape');
  }

  return data;
}

/** GET /todos?_limit=10. Throws ApiError. */
export async function fetchTodos(): Promise<Todo[]> {
  return requestJson(`${API_BASE}/todos?_limit=10`, {}, isTodoArray);
}

/** POST /todos with the trimmed title, completed false, userId 1. Throws ApiError. */
export async function createTodo(title: string): Promise<Todo> {
  return requestJson(
    `${API_BASE}/todos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        title: title.trim(),
        completed: false,
        userId: USER_ID,
      }),
    },
    isTodo,
  );
}
