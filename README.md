# todo

A React Native (Expo) to-do app: it loads the first ten tasks from the JSONPlaceholder API,
and lets you add, complete and delete tasks, with clear loading, error and empty states.

> Status: infrastructure only. The logic and screen are built through the issues in
> [the roadmap](docs/ROADMAP.md). This README gains usage and screenshots when M3 lands.

## Run it

Needs Node.js 22 and the Expo Go app on a phone (or an Android emulator).

```sh
npm ci
npx expo start        # scan the QR code with Expo Go; or press a (Android) / w (web)
```

## Test

```sh
npm test              # Jest
npm run ci            # lint, typecheck, doc checks, tests, Android JS bundle (what CI runs)
```

## Documents

| File | What |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | The brief as numbered requirements, each with its proof |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Decisions D1-D10 and what else was considered |
| [docs/API.md](docs/API.md) | The JSONPlaceholder calls, failures and quirks |
| [docs/STATE_MACHINES.md](docs/STATE_MACHINES.md) | The screen's states and events |
| [AGENTS.md](AGENTS.md) | Rules for anyone (or any agent) working on an issue |
