// Runs todosReducer with its effects: storage, fetch, POST (D2). Issue #5 fills it.
import { notImplemented } from '../lib/notImplemented';
import type { ScreenState } from './types';

export type UseTodos = {
  state: ScreenState;
  retry(): void;
  reload(): void;
  /** Validates with validateTitle; returns the validation message, or null when sent. */
  add(title: string): string | null;
  toggle(localId: string): void;
  remove(localId: string): void;
};

export function useTodos(): UseTodos {
  return notImplemented('#5 useTodos');
}
