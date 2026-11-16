## Goal

Closes #<n> once a reviewer has checked the gate. The owner's goal in one sentence.

## Evidence

Each gate line from the issue, with its command and result.

- [ ] Tests written first, seen failing: <test names>
- [ ] Negative control: <fix reverted> -> <test> fails
- [ ] `npm run ci` -> exit 0
- [ ] Ubuntu and Windows CI green

## Decisions and docs

D or T ids this relies on; docs updated in this PR (`docs/API.md`, `docs/STATE_MACHINES.md`, ...).
