// docs/STATE_MACHINES.md. The two tables are the charts as data (D13); issue #3 fills the reducer.
import type { Transition } from '../lib/machine';
import type {
  AddEventType,
  AddKind,
  ScreenEventType,
  ScreenKind,
  ScreenState,
  Task,
  TodosEvent,
} from './types';

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

function reduceReady(
  state: Extract<ScreenState, { kind: 'ready' }>,
  event: TodosEvent,
): ScreenState {
  switch (event.type) {
    case 'RELOAD':
      return { kind: 'loading' };
    case 'TOGGLE':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.localId === event.localId ? { ...task, completed: !task.completed } : task,
        ),
      };
    case 'DELETE':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.localId !== event.localId),
      };
    case 'ADD_START':
      if (state.add.kind !== 'idle' && state.add.kind !== 'error') return state;
      return { ...state, add: { kind: 'saving' } };
    case 'ADD_OK': {
      if (state.add.kind !== 'saving') return state;
      const newTask: Task = {
        localId: `local-${state.nextLocalId}`,
        serverId: event.todo.id,
        title: event.todo.title,
        completed: event.todo.completed,
      };
      return {
        ...state,
        tasks: [newTask, ...state.tasks],
        add: { kind: 'idle' },
        nextLocalId: state.nextLocalId + 1,
      };
    }
    case 'ADD_ERROR':
      if (state.add.kind !== 'saving') return state;
      return { ...state, add: { kind: 'error', error: event.error } };
    case 'ADD_DISMISS':
      if (state.add.kind !== 'error') return state;
      return { ...state, add: { kind: 'idle' } };
    default:
      return state;
  }
}

export function todosReducer(state: ScreenState, event: TodosEvent): ScreenState {
  switch (state.kind) {
    case 'hydrating':
      if (event.type === 'RESTORED') {
        return {
          kind: 'ready',
          tasks: event.tasks,
          add: { kind: 'idle' },
          nextLocalId: event.nextLocalId,
        };
      }
      if (event.type === 'NOTHING_STORED') {
        return { kind: 'loading' };
      }
      return state;
    case 'loading':
      if (event.type === 'FETCH_OK') {
        return {
          kind: 'ready',
          tasks: event.todos.map((todo) => ({
            localId: `server-${todo.id}`,
            serverId: todo.id,
            title: todo.title,
            completed: todo.completed,
          })),
          add: { kind: 'idle' },
          nextLocalId: 1,
        };
      }
      if (event.type === 'FETCH_ERROR') {
        return { kind: 'failed', error: event.error };
      }
      return state;
    case 'failed':
      if (event.type === 'RETRY') {
        return { kind: 'loading' };
      }
      return state;
    case 'ready':
      return reduceReady(state, event);
  }
}
