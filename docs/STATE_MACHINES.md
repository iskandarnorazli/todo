# State machines

The screen is one pure reducer, `src/todos/todosReducer.ts`, over the states below.
`src/todos/todosReducer.test.ts` covers every (state, event) pair: drawn pairs move to the
drawn state, every other pair leaves the state unchanged (returns the same object). A change to
this chart goes in the same commit as the reducer and its test. The reducer does not exist
yet; the issue that builds it links here.

## Screen

```mermaid
stateDiagram-v2
  [*] --> hydrating
  hydrating --> ready: RESTORED(items), items stored (D5 A)
  hydrating --> loading: RESTORED(none)
  loading --> ready: FETCH_OK(todos)
  loading --> failed: FETCH_ERROR(error)
  failed --> loading: RETRY
  ready --> loading: RELOAD (confirmed)
  ready --> ready: TOGGLE(localId) / DELETE(localId)
```

```ts
type Task = { localId: string; serverId: number; title: string; completed: boolean };
type AddStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; error: ApiError };
type ScreenState =
  | { kind: 'hydrating' }
  | { kind: 'loading' }
  | { kind: 'failed'; error: ApiError }
  | { kind: 'ready'; tasks: Task[]; add: AddStatus; nextLocalId: number };
```

"Empty" is not a state: it is `ready` with `tasks.length === 0`, and the screen shows the
empty state (T8) with the add form still available.

## Adding a task, inside `ready`

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> saving: ADD_START (title valid by D6)
  saving --> idle: ADD_OK(todo), the task is put first (T4, D7)
  saving --> error: ADD_ERROR(error) (T11)
  error --> saving: ADD_START
  error --> idle: ADD_DISMISS or editing the title
```

- In `saving`, `ADD_START` changes nothing (T10: no double submit); the button is disabled.
- `ADD_START` with an invalid title is never sent: the form shows the validation message and dispatches nothing (T9).
- `TOGGLE` and `DELETE` work while a task is `saving`.
- When the list was replaced while a POST was in flight (`RELOAD`), the late `ADD_OK` still adds the task; there is no cancel.
