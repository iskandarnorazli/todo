// Runs todosReducer with its effects: storage, fetch, POST (D2). Issue #5 fills it.
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createTodo, fetchTodos } from '../api/todosApi';
import { ApiError } from '../api/types';
import { loadTasks, saveTasks } from './storage';
import { initialState, todosReducer } from './todosReducer';
import type { ScreenState } from './types';
import { validateTitle } from './validateTitle';

export type UseTodos = {
  state: ScreenState;
  retry(): void;
  reload(): void;
  /** Validates with validateTitle; returns the validation message, or null when sent. */
  add(title: string): string | null;
  dismissAddError(): void;
  toggle(localId: string): void;
  remove(localId: string): void;
};

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('network', error instanceof Error ? error.message : 'Request failed');
}

export function useTodos(): UseTodos {
  const [state, dispatch] = useReducer(todosReducer, initialState);
  const mountedRef = useRef(true);
  const stateRef = useRef(state);
  const savingRef = useRef(false);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadTasks().then((stored) => {
      if (!active || !mountedRef.current) return;
      if (stored) {
        dispatch({ type: 'RESTORED', tasks: stored.tasks, nextLocalId: stored.nextLocalId });
      } else {
        dispatch({ type: 'NOTHING_STORED' });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.kind !== 'loading') return;
    const gen = ++fetchGenerationRef.current;
    savingRef.current = false;

    void fetchTodos()
      .then((todos) => {
        if (!mountedRef.current || fetchGenerationRef.current !== gen) return;
        dispatch({ type: 'FETCH_OK', todos });
      })
      .catch((error: unknown) => {
        if (!mountedRef.current || fetchGenerationRef.current !== gen) return;
        dispatch({ type: 'FETCH_ERROR', error: toApiError(error) });
      });
  }, [state.kind]);

  useEffect(() => {
    if (state.kind !== 'ready') return;
    void saveTasks({ tasks: state.tasks, nextLocalId: state.nextLocalId });
  }, [state]);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const reload = useCallback(() => {
    dispatch({ type: 'RELOAD' });
  }, []);

  const add = useCallback((title: string): string | null => {
    const check = validateTitle(title);
    if (!check.ok) return check.message;

    const current = stateRef.current;
    if (current.kind !== 'ready' || current.add.kind === 'saving' || savingRef.current) {
      return null;
    }

    savingRef.current = true;
    const gen = fetchGenerationRef.current;
    dispatch({ type: 'ADD_START' });

    void createTodo(check.title)
      .then((todo) => {
        savingRef.current = false;
        if (!mountedRef.current || fetchGenerationRef.current !== gen) return;
        dispatch({ type: 'ADD_OK', todo });
      })
      .catch((error: unknown) => {
        savingRef.current = false;
        if (!mountedRef.current || fetchGenerationRef.current !== gen) return;
        dispatch({ type: 'ADD_ERROR', error: toApiError(error) });
      });

    return null;
  }, []);

  const dismissAddError = useCallback(() => {
    dispatch({ type: 'ADD_DISMISS' });
  }, []);

  const toggle = useCallback((localId: string) => {
    dispatch({ type: 'TOGGLE', localId });
  }, []);

  const remove = useCallback((localId: string) => {
    dispatch({ type: 'DELETE', localId });
  }, []);

  return { state, retry, reload, add, dismissAddError, toggle, remove };
}
