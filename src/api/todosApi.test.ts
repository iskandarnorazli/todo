import { LIST_ERROR_MESSAGE, ADD_ERROR_MESSAGE } from './messages';
import { API_BASE, TIMEOUT_MS, USER_ID, createTodo, fetchTodos } from './todosApi';
import { ApiError, type ApiErrorKind } from './types';

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('todosApi (D4)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('fetchTodos requests GET /todos?_limit=10 and returns the 10 todos', async () => {
    const todos = Array.from({ length: 10 }, (_, i) => ({
      userId: 1,
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: i % 2 === 0,
    }));
    const fetchMock = jest.fn().mockResolvedValue(mockResponse(200, todos));
    globalThis.fetch = fetchMock;

    const result = await fetchTodos();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/todos?_limit=10`);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(result).toEqual(todos);
  });

  it('createTodo trims title and sends POST /todos with JSON body and content type', async () => {
    const created = { userId: USER_ID, id: 201, title: 'Buy milk', completed: false };
    const fetchMock = jest.fn().mockResolvedValue(mockResponse(201, created));
    globalThis.fetch = fetchMock;

    const result = await createTodo('  Buy milk ');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/todos`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json; charset=UTF-8',
    });
    expect(init.body).toBe(
      JSON.stringify({ title: 'Buy milk', completed: false, userId: USER_ID }),
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(result).toEqual(created);
  });

  it('throws ApiError(http, status: 500) on non-2xx response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse(500, {}));

    await expect(fetchTodos()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 500,
    });
  });

  it('throws ApiError(network) when fetch rejects', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchTodos()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
    });
  });

  it.each([
    ['object instead of array', { oops: 1 }],
    ['array with invalid todo item', [{ id: '1' }]],
    ['null', null],
  ])('throws ApiError(shape) for fetchTodos when body is %s', async (_label, body) => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse(200, body));

    await expect(fetchTodos()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'shape',
    });
  });

  it('throws ApiError(shape) when response.json() rejects with invalid JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(createTodo('Buy milk')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'shape',
    });
  });

  it('throws ApiError(timeout) and aborts AbortController when no answer in 10 s', async () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = jest.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        capturedSignal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const promise = fetchTodos();
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'timeout',
    });

    await jest.advanceTimersByTimeAsync(TIMEOUT_MS);
    await assertion;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('maps every ApiErrorKind to user text in LIST_ERROR_MESSAGE and ADD_ERROR_MESSAGE', () => {
    const kinds: ApiErrorKind[] = ['network', 'timeout', 'http', 'shape'];
    for (const kind of kinds) {
      expect(typeof LIST_ERROR_MESSAGE[kind]).toBe('string');
      expect(LIST_ERROR_MESSAGE[kind].length).toBeGreaterThan(0);
      expect(typeof ADD_ERROR_MESSAGE[kind]).toBe('string');
      expect(ADD_ERROR_MESSAGE[kind].length).toBeGreaterThan(0);
      const err = new ApiError(kind, 'msg', kind === 'http' ? 500 : undefined);
      expect(err.kind).toBe(kind);
    }
  });

  it('throws ApiError(timeout) when headers arrive but response.json() never resolves (#16)', async () => {
    jest.useFakeTimers();

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    } as unknown as Response);

    const promise = fetchTodos();
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'timeout',
    });

    await jest.advanceTimersByTimeAsync(TIMEOUT_MS);
    await assertion;
  });
});
