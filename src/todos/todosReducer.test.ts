import * as fc from 'fast-check';
import { ApiError, type Todo } from '../api/types';
import { checkMachine } from '../testing/checkMachine';
import {
  ADD_TRANSITIONS,
  SCREEN_TRANSITIONS,
  initialState,
  todosReducer,
} from './todosReducer';
import {
  ADD_EVENTS,
  ADD_KINDS,
  SCREEN_EVENTS,
  SCREEN_KINDS,
  type AddEventType,
  type AddKind,
  type ScreenEventType,
  type ScreenKind,
  type ScreenState,
  type Task,
  type TodosEvent,
} from './types';

const sampleError = new ApiError('network', 'Network error');

const sampleTodo = (id: number, title = `Todo ${id}`, completed = false): Todo => ({
  userId: 1,
  id,
  title,
  completed,
});

const sampleTask = (localId: string, serverId: number, title = 'Task', completed = false): Task => ({
  localId,
  serverId,
  title,
  completed,
});

describe('todosReducer (D3, D7)', () => {
  it('satisfies SCREEN_TRANSITIONS for every (state, event) pair', () => {
    const states: ScreenState[] = [
      initialState,
      { kind: 'loading' },
      { kind: 'failed', error: sampleError },
      {
        kind: 'ready',
        tasks: [sampleTask('server-1', 1)],
        add: { kind: 'idle' },
        nextLocalId: 1,
      },
    ];

    type ScreenEv = Extract<TodosEvent, { type: ScreenEventType }>;
    const events: ScreenEv[] = [
      { type: 'RESTORED', tasks: [sampleTask('server-1', 1)], nextLocalId: 1 },
      { type: 'NOTHING_STORED' },
      { type: 'FETCH_OK', todos: [sampleTodo(1)] },
      { type: 'FETCH_ERROR', error: sampleError },
      { type: 'RETRY' },
      { type: 'RELOAD' },
      { type: 'TOGGLE', localId: 'server-1' },
      { type: 'DELETE', localId: 'server-1' },
    ];

    checkMachine<ScreenState, ScreenEv, ScreenKind, ScreenEventType>({
      reducer: (s, e) => todosReducer(s, e),
      table: SCREEN_TRANSITIONS,
      kinds: SCREEN_KINDS,
      eventTypes: SCREEN_EVENTS,
      states,
      events,
      kindOf: (s) => s.kind,
    });
  });

  it('satisfies ADD_TRANSITIONS for every (state, event) pair including outside ready', () => {
    const kinds: readonly (AddKind | 'outside')[] = [...ADD_KINDS, 'outside'];

    const states: ScreenState[] = [
      initialState,
      { kind: 'loading' },
      { kind: 'failed', error: sampleError },
      { kind: 'ready', tasks: [], add: { kind: 'idle' }, nextLocalId: 1 },
      { kind: 'ready', tasks: [], add: { kind: 'saving' }, nextLocalId: 1 },
      { kind: 'ready', tasks: [], add: { kind: 'error', error: sampleError }, nextLocalId: 1 },
    ];

    type AddEv = Extract<TodosEvent, { type: AddEventType }>;
    const events: AddEv[] = [
      { type: 'ADD_START' },
      { type: 'ADD_OK', todo: sampleTodo(201, 'Buy milk') },
      { type: 'ADD_ERROR', error: sampleError },
      { type: 'ADD_DISMISS' },
    ];

    checkMachine<ScreenState, AddEv, AddKind | 'outside', AddEventType>({
      reducer: (s, e) => todosReducer(s, e),
      table: ADD_TRANSITIONS,
      kinds,
      eventTypes: ADD_EVENTS,
      states,
      events,
      kindOf: (s) => (s.kind === 'ready' ? s.add.kind : 'outside'),
    });
  });

  it('assigns distinct localIds for two ADD_OK with server id 201 and puts new tasks first (D3, D7)', () => {
    let state: ScreenState = {
      kind: 'ready',
      tasks: [sampleTask('server-1', 1, 'Existing')],
      add: { kind: 'idle' },
      nextLocalId: 1,
    };

    state = todosReducer(state, { type: 'ADD_START' });
    state = todosReducer(state, { type: 'ADD_OK', todo: sampleTodo(201, 'First added') });
    state = todosReducer(state, { type: 'ADD_START' });
    state = todosReducer(state, { type: 'ADD_OK', todo: sampleTodo(201, 'Second added') });

    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') return;

    expect(state.tasks.map((t) => t.title)).toEqual(['Second added', 'First added', 'Existing']);
    const [second, first] = state.tasks;
    if (!second || !first) throw new Error('expected two added tasks');
    expect(second.serverId).toBe(201);
    expect(first.serverId).toBe(201);
    expect(second.localId).not.toBe(first.localId);
    expect(state.nextLocalId).toBe(3);

    const afterDelete = todosReducer(state, { type: 'DELETE', localId: first.localId });
    expect(afterDelete.kind).toBe('ready');
    if (afterDelete.kind !== 'ready') return;
    expect(afterDelete.tasks.map((t) => t.localId)).toEqual([second.localId, 'server-1']);
  });

  it('TOGGLE flips only the task with matching localId', () => {
    const start: ScreenState = {
      kind: 'ready',
      tasks: [
        sampleTask('server-1', 1, 'One', false),
        sampleTask('server-2', 2, 'Two', true),
      ],
      add: { kind: 'saving' },
      nextLocalId: 1,
    };

    const next = todosReducer(start, { type: 'TOGGLE', localId: 'server-1' });
    expect(next.kind).toBe('ready');
    if (next.kind !== 'ready') return;

    expect(next.tasks[0]?.completed).toBe(true);
    expect(next.tasks[1]?.completed).toBe(true);
    expect(next.add).toEqual({ kind: 'saving' });
  });

  it('ADD_START in saving returns the exact same state object', () => {
    const saving: ScreenState = {
      kind: 'ready',
      tasks: [],
      add: { kind: 'saving' },
      nextLocalId: 1,
    };
    expect(todosReducer(saving, { type: 'ADD_START' })).toBe(saving);
  });

  it('FETCH_OK builds localId = "server-" + id', () => {
    const next = todosReducer(
      { kind: 'loading' },
      {
        type: 'FETCH_OK',
        todos: [sampleTodo(1, 'Alpha', false), sampleTodo(2, 'Beta', true)],
      },
    );

    expect(next).toEqual({
      kind: 'ready',
      tasks: [
        { localId: 'server-1', serverId: 1, title: 'Alpha', completed: false },
        { localId: 'server-2', serverId: 2, title: 'Beta', completed: true },
      ],
      add: { kind: 'idle' },
      nextLocalId: 1,
    });
  });

  it('preserves localId uniqueness, nextLocalId bound, and task count invariants over random sequences', () => {
    const todoArb = fc.record({
      userId: fc.constant(1),
      id: fc.integer({ min: 1, max: 201 }),
      title: fc.string({ minLength: 1, maxLength: 20 }),
      completed: fc.boolean(),
    });

    const eventArb: fc.Arbitrary<TodosEvent> = fc.oneof(
      fc.record({
        type: fc.constant('RESTORED' as const),
        tasks: fc.uniqueArray(fc.integer({ min: 1, max: 10 }), { maxLength: 5 }).map((ids) =>
          ids.map((id) => sampleTask(`server-${id}`, id, `Task ${id}`)),
        ),
        nextLocalId: fc.integer({ min: 1, max: 20 }),
      }),
      fc.constant({ type: 'NOTHING_STORED' as const }),
      fc.record({
        type: fc.constant('FETCH_OK' as const),
        todos: fc.uniqueArray(fc.integer({ min: 1, max: 20 }), { maxLength: 10 }).map((ids) =>
          ids.map((id) => sampleTodo(id)),
        ),
      }),
      fc.constant({ type: 'FETCH_ERROR' as const, error: sampleError }),
      fc.constant({ type: 'RETRY' as const }),
      fc.constant({ type: 'RELOAD' as const }),
      fc.oneof(
        fc.constant({ type: 'TOGGLE' as const, localId: 'local-1' }),
        fc.constant({ type: 'TOGGLE' as const, localId: 'server-1' }),
      ),
      fc.oneof(
        fc.constant({ type: 'DELETE' as const, localId: 'local-1' }),
        fc.constant({ type: 'DELETE' as const, localId: 'server-1' }),
      ),
      fc.constant({ type: 'ADD_START' as const }),
      fc.record({ type: fc.constant('ADD_OK' as const), todo: todoArb }),
      fc.constant({ type: 'ADD_ERROR' as const, error: sampleError }),
      fc.constant({ type: 'ADD_DISMISS' as const }),
    );

    const countChangingEvents = new Set(['ADD_OK', 'DELETE', 'RESTORED', 'FETCH_OK']);

    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (sequence) => {
        let state: ScreenState = initialState;
        for (const event of sequence) {
          const prevCount = state.kind === 'ready' ? state.tasks.length : null;
          state = todosReducer(state, event);

          if (state.kind === 'ready') {
            const ids = state.tasks.map((t) => t.localId);
            expect(new Set(ids).size).toBe(ids.length);

            for (const id of ids) {
              if (id.startsWith('local-')) {
                const n = Number(id.slice('local-'.length));
                expect(state.nextLocalId).toBeGreaterThan(n);
              }
            }

            if (prevCount !== null && !countChangingEvents.has(event.type)) {
              expect(state.tasks.length).toBe(prevCount);
            }
          }
        }
      }),
      { seed: 42, numRuns: 100 },
    );
  });
});
