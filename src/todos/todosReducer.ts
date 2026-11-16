// docs/STATE_MACHINES.md. The two tables are the charts as data (D13); issue #3 fills the reducer.
import type { Transition } from '../lib/machine';
import { notImplemented } from '../lib/notImplemented';
import type { AddKind, AddEventType, ScreenEventType, ScreenKind, ScreenState, TodosEvent } from './types';

export const SCREEN_TRANSITIONS: readonly Transition<ScreenKind, ScreenEventType>[] = [
  { from: 'hydrating', event: 'RESTORED', to: 'ready' },
  { from: 'hydrating', event: 'NOTHING_STORED', to: 'loading' },
  { from: 'loading', event: 'FETCH_OK', to: 'ready' },
  { from: 'loading', event: 'FETCH_ERROR', to: 'failed' },
  { from: 'failed', event: 'RETRY', to: 'loading' },
  { from: 'ready', event: 'RELOAD', to: 'loading' },
  { from: 'ready', event: 'TOGGLE', to: 'ready' },
  { from: 'ready', event: 'DELETE', to: 'ready' },
];

/** The add form's machine, read from `state.add` while the screen is `ready`. */
export const ADD_TRANSITIONS: readonly Transition<AddKind, AddEventType>[] = [
  { from: 'idle', event: 'ADD_START', to: 'saving' },
  { from: 'saving', event: 'ADD_OK', to: 'idle' },
  { from: 'saving', event: 'ADD_ERROR', to: 'error' },
  { from: 'error', event: 'ADD_START', to: 'saving' },
  { from: 'error', event: 'ADD_DISMISS', to: 'idle' },
];

export const initialState: ScreenState = { kind: 'hydrating' };

export function todosReducer(state: ScreenState, event: TodosEvent): ScreenState {
  return notImplemented('#3 todosReducer', { state, event });
}
