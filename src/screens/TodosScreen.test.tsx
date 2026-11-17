import { fireEvent, render, screen } from '@testing-library/react-native';
import { LIST_ERROR_MESSAGE } from '../api/messages';
import { ApiError } from '../api/types';
import type { Task } from '../todos/types';
import { useTodos, type UseTodos } from '../todos/useTodos';
import { TodosScreen } from './TodosScreen';

jest.mock('../todos/useTodos', () => ({
  useTodos: jest.fn(),
}));
const mockUseTodos = jest.mocked(useTodos);

function makeHookResult(overrides: Partial<UseTodos>): UseTodos {
  return {
    state: { kind: 'hydrating' },
    retry: jest.fn(),
    reload: jest.fn(),
    add: jest.fn().mockReturnValue(null),
    dismissAddError: jest.fn(),
    toggle: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  };
}

describe('TodosScreen (D2, D17)', () => {
  it('renders LoadingState when hydrating', async () => {
    mockUseTodos.mockReturnValue(makeHookResult({ state: { kind: 'hydrating' } }));
    await render(<TodosScreen />);
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Loading tasks...')).toBeTruthy();
  });

  it('renders LoadingState when loading', async () => {
    mockUseTodos.mockReturnValue(makeHookResult({ state: { kind: 'loading' } }));
    await render(<TodosScreen />);
    expect(screen.getByText('Loading tasks...')).toBeTruthy();
  });

  it('renders ErrorState with LIST_ERROR_MESSAGE and wires Retry', async () => {
    const retry = jest.fn();
    mockUseTodos.mockReturnValue(
      makeHookResult({
        state: { kind: 'failed', error: new ApiError('network', 'offline') },
        retry,
      }),
    );

    await render(<TodosScreen />);
    expect(screen.getByText(LIST_ERROR_MESSAGE.network)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState when ready with no tasks', async () => {
    mockUseTodos.mockReturnValue(
      makeHookResult({
        state: { kind: 'ready', tasks: [], add: { kind: 'idle' }, nextLocalId: 1 },
      }),
    );

    await render(<TodosScreen />);
    expect(screen.getByText('0 / 0 completed')).toBeTruthy();
    expect(screen.getByText('No tasks yet.')).toBeTruthy();
  });

  it('renders TodoList with header summary when ready with tasks', async () => {
    const tasks: Task[] = [
      { localId: 'server-1', serverId: 1, title: 'Buy groceries', completed: true },
      { localId: 'server-2', serverId: 2, title: 'Call bank', completed: false },
    ];
    mockUseTodos.mockReturnValue(
      makeHookResult({
        state: { kind: 'ready', tasks, add: { kind: 'idle' }, nextLocalId: 1 },
      }),
    );

    await render(<TodosScreen />);
    expect(screen.getByText('1 / 2 completed')).toBeTruthy();
    expect(screen.getByText('Buy groceries')).toBeTruthy();
    expect(screen.getByText('Call bank')).toBeTruthy();
  });

  it('Reload then Cancel leaves reload uncalled', async () => {
    const reload = jest.fn();
    mockUseTodos.mockReturnValue(
      makeHookResult({
        state: {
          kind: 'ready',
          tasks: [{ localId: 'server-1', serverId: 1, title: 'Buy groceries', completed: false }],
          add: { kind: 'idle' },
          nextLocalId: 1,
        },
        reload,
      }),
    );

    await render(<TodosScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
    expect(screen.getByText('Reload from server?')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(reload).not.toHaveBeenCalled();
  });

  it('Reload then Confirm calls reload once', async () => {
    const reload = jest.fn();
    mockUseTodos.mockReturnValue(
      makeHookResult({
        state: {
          kind: 'ready',
          tasks: [{ localId: 'server-1', serverId: 1, title: 'Buy groceries', completed: false }],
          add: { kind: 'idle' },
          nextLocalId: 1,
        },
        reload,
      }),
    );

    await render(<TodosScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm reload' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
