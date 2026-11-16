// The only code that calls fetch (lint, D4). Issue #2 fills the bodies.
import { notImplemented } from '../lib/notImplemented';
import type { Todo } from './types';

export const API_BASE = 'https://jsonplaceholder.typicode.com';
export const TIMEOUT_MS = 10_000;
export const USER_ID = 1;

/** GET /todos?_limit=10. Throws ApiError. */
export async function fetchTodos(): Promise<Todo[]> {
  return notImplemented('#2 fetchTodos');
}

/** POST /todos with the trimmed title, completed false, userId 1. Throws ApiError. */
export async function createTodo(title: string): Promise<Todo> {
  return notImplemented('#2 createTodo', { title });
}
