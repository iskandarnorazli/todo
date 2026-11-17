import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { STORAGE_KEY, type StoredTasks } from './storage';
import { useTodos } from './useTodos';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const sampleTodos = Array.from({ length: 10 }, (_, i) => ({
  userId: 1,
  id: i + 1,
  title: `Todo ${i + 1}`,
  completed: i % 2 === 0,
}));

describe('useTodos (D2, D5)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('hydrates from empty storage, fetches 10 todos, and saves them to storage', async () => {
    let resolveLoad!: (value: string | null) => void;
    jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    let resolveFetch!: (res: Response) => void;
    globalThis.fetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = await renderHook(() => useTodos());
    expect(result.current.state.kind).toBe('hydrating');

    await act(async () => {
      resolveLoad(null);
    });
    expect(result.current.state.kind).toBe('loading');

    await act(async () => {
      resolveFetch(mockResponse(200, sampleTodos));
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
    });

    if (result.current.state.kind !== 'ready') return;
    expect(result.current.state.tasks).toHaveLength(10);
    expect(result.current.state.tasks[0]?.localId).toBe('server-1');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string) as StoredTasks;
    expect(stored.tasks).toHaveLength(10);
  });

  it('restores stored list without calling fetch (D5)', async () => {
    const stored: StoredTasks = {
      tasks: [{ localId: 'server-1', serverId: 1, title: 'Stored task', completed: false }],
      nextLocalId: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    const { result } = await renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
    });

    expect(fetchMock).not.toHaveBeenCalled();
    if (result.current.state.kind !== 'ready') return;
    expect(result.current.state.tasks).toEqual(stored.tasks);
  });

  it('transitions to failed on fetch error and recovers on retry()', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(mockResponse(200, sampleTodos));
    globalThis.fetch = fetchMock;

    const { result } = await renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.state.kind).toBe('failed');
    });

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('posts once when add() is called twice quickly and puts the new task first', async () => {
    const stored: StoredTasks = {
      tasks: [{ localId: 'server-1', serverId: 1, title: 'Existing', completed: false }],
      nextLocalId: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    let resolvePost!: (res: Response) => void;
    const postPromise = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(postPromise);
    globalThis.fetch = fetchMock;

    const { result } = await renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
    });

    expect(result.current.add('   ')).toBe('Enter a task title.');
    expect(fetchMock).not.toHaveBeenCalled();

    let firstErr: string | null = 'unset';
    let secondErr: string | null = 'unset';
    await act(async () => {
      firstErr = result.current.add('Buy milk');
      secondErr = result.current.add('Second ignored');
    });

    expect(firstErr).toBeNull();
    expect(secondErr).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePost(mockResponse(201, { userId: 1, id: 201, title: 'Buy milk', completed: false }));
      await postPromise;
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
      if (result.current.state.kind !== 'ready') return;
      expect(result.current.state.tasks[0]?.title).toBe('Buy milk');
    });
  });

  it('does not update state or log act warnings when unmounted during a fetch', async () => {
    let resolveFetch!: (res: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    globalThis.fetch = jest.fn().mockReturnValue(fetchPromise);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = await renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.state.kind).toBe('loading');
    });

    await unmount();

    await act(async () => {
      resolveFetch(mockResponse(200, sampleTodos));
      await fetchPromise;
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('dismissAddError clears an add error to idle and is a no-op otherwise (#22)', async () => {
    const stored: StoredTasks = {
      tasks: [{ localId: 'server-1', serverId: 1, title: 'Existing', completed: false }],
      nextLocalId: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new TypeError('offline'));

    const { result } = await renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
    });

    await act(async () => {
      result.current.add('Buy milk');
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe('ready');
      if (result.current.state.kind !== 'ready') return;
      expect(result.current.state.add.kind).toBe('error');
    });

    await act(async () => {
      result.current.dismissAddError();
    });

    expect(result.current.state.kind).toBe('ready');
    if (result.current.state.kind !== 'ready') return;
    expect(result.current.state.add).toEqual({ kind: 'idle' });

    const idleState = result.current.state;
    await act(async () => {
      result.current.dismissAddError();
    });
    expect(result.current.state).toBe(idleState);
  });
});
