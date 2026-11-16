---
name: changing-behaviour
description: How to add, change, rename or remove a state, an event, a screen state, an API behaviour or a test without weakening the tests - the four kinds of change, what counts as weakening, the chain of files a state change touches, and the test-guard check. Use before editing any existing test, a transition table, docs/STATE_MACHINES.md, docs/UX_FLOWS.md, docs/API.md or src/api/messages.ts.
---

# Changing behaviour without weakening tests

Tests here are the record of decided behaviour. When behaviour changes, the tests change
**after** the decision, in the same PR, and never by becoming easier to pass. The `test-guard`
CI check (`scripts/check-test-diff.mjs`) reads every PR's diff and fails on the patterns below
unless the owner has labelled the PR `test-change-approved`. Agents never add that label.

## First, name the kind of change

| Kind | Example | Existing tests | Who decides |
|---|---|---|---|
| **New behaviour** | A new event, a new screen state, a new failure kind | Unchanged. New tests are added. | The issue |
| **Refactor** | Moving code, renaming internals | Unchanged and still green. Not one assertion edited. | The issue |
| **Decided change** | The owner changes D5, a budget, a message or a state | Edited to the new decision, in the same PR as the doc change | The owner, recorded in `docs/` first |
| **The test was wrong** | It asserts something no doc or decision says | Fixed, with the doc line that shows it was wrong | The owner: file a Finding, wait for the label |

If you cannot say which kind it is, it is a decided change: stop with `needs-decision`.

## What counts as weakening

Each of these needs the owner's `test-change-approved`, and the PR body says why:

- deleting a test, an `expect`, an `assert`, or a whole test file;
- `.skip`, `.only`, `.todo`, `.fixme`, `xit`, `xdescribe`, or a `return` before the assertions;
- loosening a matcher: `toEqual` to `toMatchObject`, `toBe(x)` to `toBeTruthy()`, an exact count to `toBeGreaterThan`, a shape check in `todosApi` to none;
- widening an expected value: a range, a regex that matches more, an `or` of outcomes;
- fewer property-test runs, a changed seed to dodge a failure, a smaller input generator;
- more timeout or retries to hide a flaky test (fix the cause: a fake clock, a wait for a state);
- catching an error inside a test, or mocking the unit under test;
- a raised step budget in `docs/UX_FLOWS.md`;
- removing a row from a transition table or a state from `docs/UX_FLOWS.md` without its replacement.

Not weakening: renaming a test, splitting one test into several that keep every assertion,
moving a test with its assertions (the commit message lists where each went), adding cases.

## Adding a state or an event (the screen reducer)

Do these in order; each step's check fails until the next is done, which is how you know the
chain is complete.

1. `docs/STATE_MACHINES.md`: draw the new arrows. Changing a chart is a decided change unless the issue already says so.
2. `src/todos/types.ts` and `src/todos/todosReducer.ts`: add the kind to `SCREEN_KINDS` / `ADD_KINDS` or the event to `SCREEN_EVENTS` / `ADD_EVENTS`, the type to the union, the rows to `SCREEN_TRANSITIONS` / `ADD_TRANSITIONS`. `node scripts/check-state-machines.mjs` must pass.
3. The reducer: handle the new pairs.
4. `src/todos/todosReducer.test.ts`: add a sample state of the new kind and a sample event to both `checkMachine` calls. `checkMachine` fails with "no sample state of kind X" until you do. Add case tests for the new arrows, and extend the fast-check event generator with the new event.
5. A new state the user can see: add rows to the Screens table in `docs/UX_FLOWS.md` and entries in `e2e/screens.ts` (`planned`, then `built` with `open()` and `stubApi`). `node scripts/check-ux.mjs` must pass.
6. The PR's "UI snapshots" comment shows the new state; the owner reviews it (`ui-evidence` skill).

## Renaming or removing a state, event or screen state

The same chain, and every test that named the old one is moved to the new one with its
assertions intact. Removing a state with no replacement is a decided change. The commit message
lists each moved or removed test and why.

## Changing API handling

`docs/API.md` changes first, then `src/api/types.ts` and `src/api/messages.ts`, then the tests, in
one PR. A new failure kind is new behaviour (a new `ApiErrorKind`, a message, a test); changing
what the user sees for an existing one is a decided change. Tests keep stubbing `fetch`; none
calls the real API.

## Screenshots and flows

Screenshots are review material, not tests: a changed image is expected when the UI changes,
and the owner judges it in the snapshot comment. Step budgets are tests: a flow spec that goes
over budget is a design question for the owner, never a reason to raise the number.

## Before you push

```sh
node scripts/check-test-diff.mjs origin/main
```

It prints every flagged line. Either change your work so nothing is flagged, or stop and ask the
owner for `test-change-approved`, with the list and the reason.
