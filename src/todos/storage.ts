// The only code that touches AsyncStorage (lint, D5). Issue #4 fills the bodies.
import { notImplemented } from '../lib/notImplemented';
import type { Task } from './types';

export const STORAGE_KEY = 'todo/tasks/v1';

export type StoredTasks = { tasks: Task[]; nextLocalId: number };

/** null when nothing is stored or the stored value is unreadable; never throws. */
export async function loadTasks(): Promise<StoredTasks | null> {
  return notImplemented('#4 loadTasks');
}

/** Resolves false (and does not throw) when storage fails. */
export async function saveTasks(value: StoredTasks): Promise<boolean> {
  return notImplemented('#4 saveTasks', { value });
}
