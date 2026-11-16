# API contract: JSONPlaceholder

Base URL `https://jsonplaceholder.typicode.com`. `src/api/todosApi.ts` is the only code that
calls it. Writes are simulated: the server answers as if it stored them and stores nothing.

## Calls the app makes

| Call | Request | Success | The app's handling |
|---|---|---|---|
| List (T1) | `GET /todos?_limit=10` | `200`, an array of 10 `Todo` | Each becomes a task with `localId = "server-" + id` (D3) |
| Add (T3) | `POST /todos`, `Content-Type: application/json; charset=UTF-8`, body `{"title": "<trimmed>", "completed": false, "userId": 1}` | `201`, the body echoed with `"id": 201` | Becomes a task with `localId = "local-" + counter` |

Toggle (T2) and delete (T5) are local by the brief; the app sends no `PATCH` or `DELETE`.

```ts
type Todo = { userId: number; id: number; title: string; completed: boolean };
```

## Failures and what `todosApi` returns

| What happens | `ApiError.kind` | Shown to the user |
|---|---|---|
| No network, DNS failure, connection reset | `network` | List: "Couldn't load tasks. Check your connection." with Retry. Add: "Couldn't add the task. Try again." |
| No answer in 10 s (D4) | `timeout` | Same as `network` |
| Any status outside 200-299 | `http` (with `status`) | Same, plus the status in the dev log |
| The body is not JSON or not the shape above | `shape` | Same |

The messages live in one table in `src/api/messages.ts` so the components never format errors.

## Quirks to design for

- `POST /todos` returns `id: 201` every time (D3).
- A second `GET` returns the original 10 tasks: toggles, deletes and adds are gone. With D5's option A, the app only fetches when storage is empty or the user asks to reload.
- The service sometimes answers slowly; the loading state must hold up for several seconds, and the timeout bounds it.
