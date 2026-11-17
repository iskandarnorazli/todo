// The only code that touches AsyncStorage (lint, D5). Issue #4 fills the bodies.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from './types';

export const STORAGE_KEY = 'todo/tasks/v1';

export type StoredTasks = { tasks: Task[]; nextLocalId: number };

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.localId === 'string' &&
    typeof record.serverId === 'number' &&
    typeof record.title === 'string' &&
    typeof record.completed === 'boolean'
  );
}

function isStoredTasks(value: unknown): value is StoredTasks {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.tasks) &&
    record.tasks.every(isTask) &&
    typeof record.nextLocalId === 'number'
  );
}

function validateAndRepair(stored: StoredTasks): StoredTasks | null {
  const seen = new Set<string>();
  let maxLocalId = 0;

  for (const task of stored.tasks) {
    if (seen.has(task.localId)) return null;
    seen.add(task.localId);

    if (task.localId.startsWith('local-')) {
      const n = Number(task.localId.slice('local-'.length));
      if (Number.isInteger(n) && n > maxLocalId) {
        maxLocalId = n;
      }
    }
  }

  const minNextLocalId = maxLocalId + 1;
  if (stored.nextLocalId >= minNextLocalId) return stored;
  return { tasks: stored.tasks, nextLocalId: minNextLocalId };
}

/** null when nothing is stored or the stored value is unreadable; never throws. */
export async function loadTasks(): Promise<StoredTasks | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredTasks(parsed) ? validateAndRepair(parsed) : null;
  } catch {
    return null;
  }
}

/** Resolves false (and does not throw) when storage fails. */
export async function saveTasks(value: StoredTasks): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
