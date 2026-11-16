# todo: rules for agents

How to work (goal first, evidence, tests first, the owner decides, handoffs) is the
`iskandar-mode` skill. This file is what is specific to this repository; where the two
disagree, this file wins. `CLAUDE.md` points here.

todo is a React Native (Expo) technical assessment: a single-screen to-do list on the
JSONPlaceholder API. The brief, as numbered requirements T1-T16, is
[`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md); only the owner changes it. Decisions are
numbered in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); the API contract and its quirks
are [`docs/API.md`](docs/API.md); flows with states are
[`docs/STATE_MACHINES.md`](docs/STATE_MACHINES.md). The plan of record is the GitHub
milestones and [`docs/ROADMAP.md`](docs/ROADMAP.md). The assessors grade working features,
API handling, loading and error states, readable code and component structure: write for a
reviewer who reads every file.

## Layout

| Path | What |
|---|---|
| `App.tsx` | Root: providers and the one screen |
| `src/api/` | `todosApi.ts`: the only code that calls `fetch` (timeout, status check, parsing) |
| `src/todos/` | `todosReducer.ts` (pure state machine), `useTodos.ts` (the hook that runs it), `storage.ts` (AsyncStorage, D5) |
| `src/components/` | Presentational components: `TodoList`, `TodoItem`, `AddTodoForm`, `LoadingState`, `ErrorState`, `EmptyState` |
| `.agents/state/` | task state (the `task-state` skill); the handoff between agents |

## Which issues

- Work only on issues labelled `ready:antigravity` with no `wip:` label. An empty queue means stop and say so.
- An issue blocked by another (first line "Blocked by #N") waits until #N is closed.
- Never start an issue labelled `outline` or `needs-decision`.
- These need Claude or the owner. Stop with `needs-decision` and say which:
  - the state machine's states or events (`docs/STATE_MACHINES.md`);
  - how ids are assigned (D3) or what is persisted (D5);
  - adding a dependency beyond the ones `docs/ARCHITECTURE.md` lists;
  - any decision in `docs/ARCHITECTURE.md`. A test never reverses one.

## How an issue is worked

1. Add `wip:antigravity` (or `wip:claude`). Branch from `main`: `issue/<n>-<slug>`.
2. Read the Goal, the Gate and the Stop list. Write the tests first and show them failing.
3. Commit as `Iskandar Norazli <111472977+iskandarnorazli@users.noreply.github.com>`, with no AI or Co-Authored-By lines. The message states the tests added, the commands run with their results, and the negative control: the fix turned off, the new test failing.
4. Push the branch and open a **draft** PR. Never push `main`, never force-push, never merge.
5. Comment on the issue: each gate line, its command and its result. Remove `wip:`, add `needs-review`. Never close an issue; the owner or a reviewer who did not build it does.
6. Stop and leave a comment when the work needs a file the issue does not list, a design decision, or a change to an existing test's expectation.

## Gate commands

| What | Command |
|---|---|
| Everything CI runs | `npm run ci` (lint, typecheck, doc checks, tests, Android JS bundle) |
| Tests | `npm test` |
| One test file | `npm test -- todosReducer` |
| Run the app | `npx expo start`, then Expo Go on a phone, or `a` / `w` for Android emulator / web |

## Rules for code

- **The screen's state is one reducer.** `todosReducer` is pure: `(state, event) => state`, over the union of states in `docs/STATE_MACHINES.md`. `useTodos` runs the effects (fetch, POST, storage) and sends events. Components render props and call callbacks; they hold only input text. No loose `isLoading` / `error` / `items` booleans that can disagree.
- **Every (state, event) pair has a test** in `src/todos/todosReducer.test.ts`: drawn pairs move to the drawn state, every other pair leaves the state unchanged.
- **Ids are local** (D3). React keys and toggle/delete use `localId`, never the server's `id`.
- **The API module is the only `fetch`.** It times out after 10 s, treats any non-2xx as an error, and validates the JSON shape. Tests stub `global.fetch`; they never call the real API.
- **Both platforms.** CI runs Windows and Linux. npm scripts use no shell-specific syntax (no `rm -rf`, no `VAR=x cmd`); use a node script when a step needs logic.

## Traps

- **`POST /todos` always answers `id: 201`.** Two added tasks share a server id. That is why ids are local (D3).
- **`workflow_dispatch` only finds workflows on `main`.** A new workflow file runs by dispatch only after it is merged.
- **Writes do not persist on JSONPlaceholder.** A refetch restores the original 10 tasks; this is expected by the brief.
- **`fetch` in React Native never times out by itself.** Use the `AbortController` in `todosApi.ts`.
- **`@testing-library/react-native` needs `react-test-renderer` at exactly the installed `react` version** (the first lockfile run failed with ERESOLVE on React 19.3.0 vs 19.3.1). Add both together: `npx expo install @testing-library/react-native react-test-renderer@<react version>`.
- **Dependency versions come from Expo's table.** Add a package with `npx expo install <pkg>`, not `npm install`, so it matches the SDK; without network, use the `lockfile` workflow.
