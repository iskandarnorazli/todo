# Architecture and decisions

Each decision has an id. Status is `decided (who, date)`, `proposed` (Claude's recommendation,
holds until the owner says otherwise) or `open` (an issue labelled `needs-decision` waits for
it). A test never reverses a decision; a changed decision is edited here first.

## The shape

```mermaid
flowchart TB
  App[App.tsx] --> Screen[TodosScreen]
  Screen -- "state, callbacks" --> List[TodoList / TodoItem]
  Screen --> Form[AddTodoForm]
  Screen --> States[LoadingState / ErrorState / EmptyState]
  Screen -- "useTodos()" --> Hook[useTodos: runs effects, dispatches events]
  Hook --> Reducer[todosReducer: pure state machine]
  Hook --> Api[todosApi: the only fetch]
  Hook --> Storage[storage: AsyncStorage]
  Api --> JP[(jsonplaceholder.typicode.com)]
```

## Decisions

| Id | Decision | Status |
|---|---|---|
| D1 | Expo (managed, runs in Expo Go), TypeScript, functional components and hooks, `fetch`. No navigation library: the app is one screen. | decided (owner, 2026-11-16) |
| D2 | Screen state is one `useReducer` over a union of states (`docs/STATE_MACHINES.md`), run by a `useTodos` hook. No Redux, Zustand or TanStack Query. | decided (owner, 2026-11-16) |
| D3 | Every task gets a `localId` on arrival (`server-<id>` for fetched tasks, `local-<counter>` for added ones). Keys, toggle and delete use `localId`; the server `id` is kept only for display and debugging. | proposed |
| D4 | `todosApi` sets a 10 s timeout with `AbortController`, treats any non-2xx as an error, checks the JSON shape by hand (a 15-line guard, no zod), and turns every failure into `ApiError { kind: 'network' \| 'timeout' \| 'http' \| 'shape', status? }`. | proposed |
| D5 | AsyncStorage keeps the task list (key `todo/tasks/v1`, with `nextLocalId`). On launch the stored list wins; the API is fetched only when nothing is stored, or by a Reload action after a confirm. Saved after every change. | decided (owner, 2026-11-16) |
| D6 | Titles are trimmed and must be 1 to 200 characters after trimming (`validateTitle`). The trimmed title is what is sent. | proposed |
| D7 | Added tasks go to the top of the list, so the user sees the result of the action. | proposed |
| D8 | Tests: Jest with `jest-expo`, React Native Testing Library for components, `global.fetch` stubbed per test. No test calls the real API. | proposed |
| D9 | CI on Ubuntu and Windows: lint (`expo lint`), typecheck, doc checks, tests, and `expo export --platform android` (bundles the JS, catches import and Metro errors without an emulator). No formal verification. | decided (owner, 2026-11-16) |
| D10 | Dependency versions follow the Expo SDK (`npx expo install`). `package-lock.json` is committed; a session without network uses the `lockfile` workflow. | proposed |
| D11 | The skeleton is the contract: every module, type and signature the issues need exists, with bodies that call `notImplemented('#<issue>')`. Issues fill bodies; a signature change stops with `needs-decision`. | decided (owner, 2026-11-16) |
| D12 | Tests are deterministic: `fetch` is stubbed, timers are fake, ids are counters in state (D3). A seeded model-based test (fast-check) drives random event sequences through `todosReducer` and checks invariants after each step; a failure prints the seed. | decided (owner, 2026-11-16) |
| D13 | State machines are reducers over discriminated unions with the transition tables exported as data (`src/lib/machine.ts`), checked against the charts by `scripts/check-state-machines.mjs` and against the reducer by `checkMachine`. Considered: XState (a dependency outside the allowed list), `useState` flags (they drift). | decided (owner, 2026-11-16) |
| D14 | The architecture is enforced by checks (below). A new rule goes in the table and into CI in the same change. | decided (owner, 2026-11-16) |
| D15 | UI screenshots and e2e flows run on the react-native-web render (`expo export --platform web`, served by `scripts/serve-static.mjs`) with the API stubbed (`e2e/api-stub.ts`); phone screenshots from Expo Go are added to UI PRs by hand. Considered: an Android emulator in CI (native, but 10-15 more minutes per run and flaky), manual only (nothing automatic). | decided (owner, 2026-11-16) |
| D16 | A stored list is trusted only when its local ids are unique and `nextLocalId` is above every `local-N`. `loadTasks` returns null for duplicate local ids (corrupt) and raises a low `nextLocalId` to one above the highest `local-N` (repair, no data lost). Found in the 2026-11-17 audit: the reducer takes `RESTORED` on trust, so a low counter would later reuse an id. | proposed |

Dependencies D1 to D10 allow: `expo`, `react`, `react-native`, `expo-status-bar`,
`@react-native-async-storage/async-storage`, `react-native-safe-area-context`, and for
development `typescript`, `@types/react`, `jest`, `jest-expo`,
`@testing-library/react-native` (with `react-test-renderer` at exactly the installed `react`
version, which it needs as a peer), `fast-check` (D12), `eslint`, `eslint-config-expo`; for the
web render and e2e (D15): `react-dom`, `react-native-web`, `@expo/metro-runtime`,
`@playwright/test`, `@types/node`. Anything else stops with
`needs-decision`.

## Module rules and what enforces them (D11, D14)

| Rule | Enforced by (all in `npm run ci`) |
|---|---|
| Only `src/api/todosApi.ts` calls `fetch` | lint: `no-restricted-globals` |
| Only `src/todos/storage.ts` imports AsyncStorage | lint: `no-restricted-imports` |
| Components (`src/components/`) take props; they import no API, storage or hook module | lint: `no-restricted-imports` patterns |
| The lint rules above report their known violations and only those | `node scripts/check-lint-rules.mjs` |
| `docs/UX_FLOWS.md` and `e2e/` agree on states and flows | `node scripts/check-ux.mjs` |
| No PR weakens the tests without the owner's `test-change-approved` label | `scripts/check-test-diff.mjs` in the `Test guard` workflow |
| Each enforced flow stays within its step budget | flow specs (`startFlow`) in `npm run e2e` |
| No `Date.now()`, `new Date()` or `Math.random()` in `src/` | lint: `no-restricted-syntax` |
| Every user-facing error text comes from `src/api/messages.ts` | type: `Record<ApiErrorKind, string>` |
| Charts in `docs/STATE_MACHINES.md` equal the tables | `node scripts/check-state-machines.mjs` |
| The reducer follows its tables for every (state, event) pair | `checkMachine` in `src/todos/todosReducer.test.ts` |
| Invariants hold over random event sequences: `localId`s unique, `nextLocalId` above every local id, a task count changes only by `ADD_OK`, `DELETE` or a reload | fast-check model test (issue #3) |

## Why, and what else was considered

**D2, one reducer.** The brief grades "clear loading and error states". A union of states
makes the impossible ones (loading and error at once, a list behind an error) unrepresentable,
and a pure reducer is tested without rendering. Considered: separate `useState` flags (they
drift: `loading=false, error=null, items=[]` means both "empty" and "not started"); TanStack
Query (less code, but it hides the API handling the assessors want to read); Zustand (a global
store for one screen).

**D3, local ids.** JSONPlaceholder answers every `POST /todos` with `id: 201`, so a second
added task would share a key with the first; React then drops or mixes rows, and deleting one
deletes both. Considered: `Date.now()` ids (collide on fast double taps); `crypto.randomUUID`
(not available in every Hermes version without a polyfill).

**D5, persistence (decided: A).**

| Option | On launch | "Reload" action | For | Against |
|---|---|---|---|---|
| A. Stored list wins (chosen) | Show the stored list if there is one; fetch only when nothing is stored | Replaces the list with a fresh fetch, after a confirm | Simple; "remain after restarting" holds exactly | The first fetch happens once per install |
| B. Fetch, then replay local changes | Always fetch, then re-apply stored toggles, deletes and adds | Not needed | The list stays in touch with the API | Fetched data never changes (writes are simulated), so the merge code buys nothing; added tasks share `id: 201`, so matching is by local id only |

In both, the reducer is unchanged: storage only feeds `RESTORED(items)` and saves on change.

**D4, hand-written guard.** One response shape (`{ userId, id, title, completed }`) does not
earn a schema library.

## Out of scope

Editing titles, reordering, filtering, multiple screens, authentication, a backend.
