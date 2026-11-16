// docs/STATE_MACHINES.md: the screen's states and events (D2, D3).
import type { ApiError, Todo } from '../api/types';

export type Task = { localId: string; serverId: number; title: string; completed: boolean };

export const ADD_KINDS = ['idle', 'saving', 'error'] as const;
export type AddKind = (typeof ADD_KINDS)[number];
export type AddStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; error: ApiError };

export const SCREEN_KINDS = ['hydrating', 'loading', 'failed', 'ready'] as const;
export type ScreenKind = (typeof SCREEN_KINDS)[number];
export type ScreenState =
  | { kind: 'hydrating' }
  | { kind: 'loading' }
  | { kind: 'failed'; error: ApiError }
  | { kind: 'ready'; tasks: Task[]; add: AddStatus; nextLocalId: number };

export const SCREEN_EVENTS = ['RESTORED', 'NOTHING_STORED', 'FETCH_OK', 'FETCH_ERROR', 'RETRY', 'RELOAD', 'TOGGLE', 'DELETE'] as const;
export type ScreenEventType = (typeof SCREEN_EVENTS)[number];

export const ADD_EVENTS = ['ADD_START', 'ADD_OK', 'ADD_ERROR', 'ADD_DISMISS'] as const;
export type AddEventType = (typeof ADD_EVENTS)[number];

export type TodosEvent =
  | { type: 'RESTORED'; tasks: Task[]; nextLocalId: number }
  | { type: 'NOTHING_STORED' }
  | { type: 'FETCH_OK'; todos: Todo[] }
  | { type: 'FETCH_ERROR'; error: ApiError }
  | { type: 'RETRY' }
  | { type: 'RELOAD' }
  | { type: 'TOGGLE'; localId: string }
  | { type: 'DELETE'; localId: string }
  | { type: 'ADD_START' }
  | { type: 'ADD_OK'; todo: Todo }
  | { type: 'ADD_ERROR'; error: ApiError }
  | { type: 'ADD_DISMISS' };
