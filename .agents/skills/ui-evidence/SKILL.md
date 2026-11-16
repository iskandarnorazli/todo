---
name: ui-evidence
description: How to show UI work as screenshots the owner can review - capture screen states and flow filmstrips, post them on a PR or issue, file a bug or UX finding with images, keep docs/UX_FLOWS.md in step, and answer the owner's review comments. Use for any change to what a screen shows, any UI bug, and any design exploration.
---

# UI evidence

The owner reviews UI from images in GitHub, not by running the app. Every change to what a
screen shows, every UI bug and every design option arrives with screenshots. The ids (S1.list, F2)
come from `docs/UX_FLOWS.md`; use them in titles, comments and commit messages.

## Capture

| What | Command (Playwright builds the web render and stubs the API itself) |
|---|---|
| Every built state, phone and tablet | `SNAP_DIR=snapshots npm run snapshots` (PowerShell: `$env:SNAP_DIR="snapshots"; npm run snapshots`) |
| Some states or flows only | add `SNAP_ONLY=S1.list,F2` |
| Flow filmstrips | `SNAP_DIR=snapshots npm run e2e`: each flow spec saves an image per step |

Files land in `snapshots/screens/<state>--<viewport>.png` and `snapshots/flows/<Flow>/`. The
folder is git-ignored; never commit screenshots to a feature branch.

## Post

- **On a PR:** nothing to do. The "UI snapshots" workflow keeps one comment on the PR with main's images beside the PR's. Check it is there and shows the states your change touches.
- **On an issue** (a bug, a design question): Actions, "UI snapshots", Run workflow, with the issue number and the ids. From a shell: `gh workflow run ui-snapshots.yml -f issue=<n> -f only=S1.error`. The images arrive as a comment.
- A state that does not exist yet cannot be captured: add it to `docs/UX_FLOWS.md` and `e2e/screens.ts` first (planned, then built in the same PR as the page).

## File a bug or a UX finding

`gh issue create --template bug.yml` fills nothing for you, so write the body in the form's order:
Where (an id), Steps, Expected (with its T or D), Actual. Then run the workflow above with the
new issue's number so it carries the screenshot. Labels: `bug` or `ux`, plus `needs-triage`;
a milestone, as the issue-writing skill says.

## A UI change in a PR

1. The issue names the states and flows it touches. Mark new states `built` in both `docs/UX_FLOWS.md` and `e2e/screens.ts`, with an `open()` that calls `stubApi` (`e2e/api-stub.ts`) and reaches the state.
2. CI shows the react-native-web render (D15). Add phone screenshots from Expo Go to the PR body for the states you changed, Android or iOS, with the device named.
3. A flow whose screen now exists gets `e2e/flows/<Flow>.spec.ts` using `startFlow`, and its row becomes `enforced`. Every user action goes through `flow.step(label, ...)`; labels are short verbs ("fill the name").
4. Never raise a flow's budget to make a spec pass. Over budget is a design question: stop with `needs-decision` and post the filmstrip.
5. Add `needs-owner-review`. The PR leaves draft only after the owner has commented on the snapshot comment.

## Answer the owner's comments

Every owner comment on a snapshot comment, issue or PR gets a reply that names what was done:
a commit (sha), a new issue (number), or a question back. A change of design the owner asks for
updates `docs/UX_FLOWS.md` (or `docs/ARCHITECTURE.md`) in the same PR.
