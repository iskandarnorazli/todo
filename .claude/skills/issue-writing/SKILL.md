---
name: issue-writing
description: How to write a GitHub issue that any agent can finish correctly without asking - Definition of Ready, executable gates, invariants turned into tests, stop conditions. Use when filing, expanding or labelling an issue ready:antigravity, and when splitting work into sub-issues.
---

# Writing issues an agent can finish

An agent finishes exactly what the issue makes checkable. Everything else it guesses. When an
agent does the wrong thing, check the issue text before blaming the agent (awan-lang's
2026-10-22 audit traced most misses to the issue, not the executor).

## Definition of Ready: label `ready:antigravity` only when every line holds

1. **Goal** is one behaviour a user or a test can observe ("a ZIP with two text files answers 422 `ZIP_ENTRY_COUNT`"), not an activity ("handle ZIP errors").
2. **Requirement**: the requirement ids (`R` or `T`) from `docs/REQUIREMENTS.md` that the issue delivers, and the decision ids (`D`) it relies on.
3. **Invariants** list what must stay true, each with the test in the Gate that checks it ("user B sees none of user A's rows").
4. **Gate** is commands with their expected result. No verb a person has to judge: "tested", "documented", "reviewed" become a command and a file path. It always includes the negative control and "Ubuntu and Windows CI jobs green on the PR".
5. **Tests to write first**, named by file, with the cases.
6. **Files** in scope, and files that **must not change**.
7. **Mechanism**: constraints, not an implementation, unless a decision fixed the mechanism. If the issue suggests one, it names the case that would break it.
8. **Stop conditions**: always the repo's `needs-decision` list from `AGENTS.md`, plus anything specific.
9. **Size** S (under 2 hours) or M (half a day). Split L into sub-issues that each meet this list.
10. **Not blocked**: the first line says "Blocked by #N" when it is, and it is not labelled ready until #N is closed.
11. **Milestone** set when filed. No milestone is never a valid state.

An issue that fails a line is labelled `outline` instead, and says which line is missing.

## The body, in this order

```markdown
Blocked by #N            (only when blocked)

## Goal
## Requirement and decisions
## Invariants
## Gate
- [ ] `<command>` -> <expected>
- [ ] Negative control: with <the fix> reverted, `<command>` fails on <test name>
- [ ] Ubuntu and Windows CI jobs green on the PR
## Tests to write first
## Files
In scope: ...  Must not change: ...
## Stop and ask if
## Size
```

## Labels

| Label | Meaning |
|---|---|
| `ready:antigravity` | Meets the Definition of Ready; any agent may take it |
| `outline` | A placeholder; not ready, names the missing line |
| `needs-decision` | Waits for the owner; names the decision and the options |
| `wip:claude`, `wip:antigravity` | Claimed; one agent per issue |
| `needs-review` | Built, evidence in a comment, waiting for a reviewer who did not build it |
| `area:app`, `area:infra`, `area:docs` | Where the change goes |
| `design` | Frontend design exploration (prototypes compared with the owner) |

## Gate patterns

```text
- [ ] `npm test -- todosReducer` -> passes, including "ADD_OK with a duplicate server id keeps both tasks"
- [ ] Negative control: with local ids replaced by the server id, the same command fails on that test
- [ ] `npm run ci` -> exit 0
- [ ] Ubuntu and Windows CI jobs green on the PR
- [ ] `Test guard` green with no `test-change-approved` label (or: the owner approved changing <test>, because <decision>)
```

Write the expected count only when the issue fixes the test list; otherwise name the tests.

A UI issue adds (the `ui-evidence` skill):

```text
- [ ] States S1.list, S1.empty marked built in docs/UX_FLOWS.md and e2e/screens.ts; the PR's "UI snapshots" comment shows them
- [ ] F2 enforced: `npm run e2e -- flows/F2` passes within its budget of 2 steps
- [ ] Phone screenshots from Expo Go in the PR body; owner commented (label needs-owner-review)
```
