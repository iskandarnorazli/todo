# Requirements

The assessment brief, restated as numbered requirements so that issues, tests and the README
can cite them. The owner holds the original PDF. Only the owner changes this file. Each row
names the issue that delivers it and the test that proves it; `(todo)` means not yet filed or
not yet written.

## Features

| Id | Requirement | Issue | Proof |
|---|---|---|---|
| T1 | Fetch the first 10 tasks from `GET /todos?_limit=10` and list them with title and completion state | (todo) | `todosApi.test.ts`, `TodoList.test.tsx` |
| T2 | Toggle a task between completed and incomplete, locally | (todo) | `todosReducer.test.ts` |
| T3 | A form adds a task through `POST /todos` with the title, `completed: false` and a `userId` such as 1 | (todo) | `todosApi.test.ts` |
| T4 | After a successful POST, the new task appears in the list at once, without reloading the screen | (todo) | `todosReducer.test.ts`, `App.test.tsx` |
| T5 | Delete a task, locally | (todo) | `todosReducer.test.ts` |
| T6 | A loading indicator while tasks are fetched | (todo) | `App.test.tsx` |
| T7 | An error message with a retry action when the fetch fails | (todo) | `App.test.tsx` |
| T8 | An empty state when no tasks remain | (todo) | `App.test.tsx` |
| T9 | Reject empty or whitespace-only titles | (todo) | `validateTitle.test.ts` |
| T10 | Disable submission while saving | (todo) | `AddTodoForm.test.tsx` |
| T11 | Show an error message if adding a task fails | (todo) | `App.test.tsx` |
| T12 | Bonus: tasks are saved with AsyncStorage and survive an app restart | (todo) | `storage.test.ts` |

## Technical constraints

| Id | Requirement | Where it is met |
|---|---|---|
| T13 | React Native with Expo, functional components and hooks; JavaScript or TypeScript | D1 |
| T14 | `fetch` or Axios; the JSONPlaceholder API; no backend, no authentication | D1, `docs/API.md` |

## Deliverables

| Id | Requirement | Where it is met |
|---|---|---|
| T15 | Source in a GitHub repository | this repository |
| T16 | A README with setup and usage instructions | `README.md` |

The brief also says what is graded: working features, correct API handling, clear loading and
error states, readable code, sensible component structure and basic mobile usability.
