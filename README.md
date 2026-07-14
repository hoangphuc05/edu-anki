# EduSpaced

EduSpaced is a flashcard study app that schedules reviews automatically using the **FSRS** (Free Spaced Repetition Scheduler) algorithm via [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs). Instead of reviewing on a fixed calendar, each card resurfaces right before you're likely to forget it.

## Features

- **Decks & cards** — create, edit, and organize flashcards into decks
- **Automatic scheduling** — every review updates a card's FSRS state (interval, stability, difficulty) and computes its next due date
- **Study sessions** — a focused question → reveal → rate loop with optimistic UI updates
- **Import / export** — bring cards in via CSV or JSON
- **Dashboard** — cards due today, streaks, and review history
- **V2 (planned)** — weak-deck recommendations and AI-assisted card generation from pasted text

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Frontend | React + Vite, Tailwind CSS, Zustand, TanStack Query |
| Backend | Node.js + Express |
| Validation | Zod (shared between client and server) |
| Database | SQLite via Prisma ORM |
| SRS engine | `ts-fsrs` |
| Testing | Jest/Vitest (unit), Supertest (integration), Playwright (E2E) |

## Project Structure

This is a monorepo (managed with Turborepo/Nx) so client and server share one set of types.

```
edu-spaced/
├── apps/
│   ├── web/                # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI (Button, Card, Modal)
│   │   │   ├── features/   # Feature modules (Decks, StudySession, Dashboard)
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   └── store/      # Zustand stores
│   └── server/              # Express backend
│       ├── src/
│       │   ├── routes/      # API route definitions
│       │   ├── controllers/ # Thin request handlers
│       │   ├── services/    # Business logic (SRS, analytics, decks)
│       │   └── middleware/  # Auth, validation, error handling
├── packages/
│   ├── shared-types/        # Zod schemas & TS interfaces shared by web + server
│   └── srs-engine/          # Wrapper around ts-fsrs (easy to test/mock)
├── prisma/                  # Database schema and migrations
└── package.json             # Workspace root
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or your workspace tool of choice — Turborepo/Nx)

### Install

```bash
git clone <repo-url>
cd edu-spaced
npm install
```

### Set up the database

```bash
npx prisma migrate dev
```

### Run in development

```bash
npm run dev
```

This starts the Express API and the Vite dev server for the React app together.

### Run with Docker

```bash
docker-compose up
```

Builds and runs the server and client containers with SQLite in a consistent environment.

## API Overview

| Endpoint | Description |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Auth |
| `GET/POST/PUT/DELETE /api/decks` | Deck CRUD |
| `GET /api/cards?deckId=...`, `POST /api/cards/import`, `DELETE /api/cards/:id` | Card CRUD & import |
| `GET /api/study/due` | Cards due for review (`nextReview <= now`) |
| `POST /api/study/review` | Submit a rating, update FSRS state, get the next card |

All routes validate their input with Zod.

## How Scheduling Works

1. **Initialization** — a new card starts with default FSRS state.
2. **Due query** — `GET /api/study/due` returns cards whose `nextReview` is null or in the past.
3. **Rating & update** — when a rating is submitted, the server loads the card's current FSRS state, calls the `ts-fsrs` scheduler, and saves the new state plus a `Review` history record.

The scheduler itself lives in `packages/srs-engine`, isolated from the rest of the app so it can be unit tested independently.

## Testing

```bash
npm run test          # unit tests (Jest/Vitest)
npm run test:integration  # Supertest against an in-memory SQLite DB
npm run test:e2e      # Playwright end-to-end tests
```

The test pyramid in this project:

- **Unit** — `StudyService` and the SRS engine (e.g. a "Hard" rating must produce a sooner next-review date than "Easy")
- **Integration** — full API flows against an in-memory database (create card → start session → rate → verify DB update)
- **E2E** — a full user journey: login, create deck, add cards, study, check dashboard

## CI/CD

GitHub Actions runs on every push to `main`:

- Lint (ESLint) and format check (Prettier)
- Unit and integration tests

On merge to `main`, Docker images are built for the client and server.

## Roadmap

| Phase | Weeks | Focus | Deliverable |
|---|---|---|---|
| 1 | 1–2 | Foundation — monorepo, Prisma schema, auth, deck/card CRUD | Users can create decks and add cards manually |
| 2 | 3–4 | Core study engine — `ts-fsrs` integration, study session UI | **V1 complete**: studying works, dates update automatically |
| 3 | 5–6 | Polish & analytics — import/export, dashboard charts | **V1 final release** |
| 4 | 7–8 | Adaptive features (V2) — weak-deck recommendations, AI card generation | V2 release |

V1 and V2 are developed on strictly separate branches — V1 ships before any V2 work begins.

## Known Risks

| Risk | Mitigation |
|---|---|
| FSRS scheduling bugs | Dedicated unit tests for the `ts-fsrs` wrapper, covering new and very old cards |
| Client/server state drift during a study session | Optimistic UI updates that revert on failure; server cache cleared between reviews |
| SQLite lock contention under concurrent writes | `better-sqlite3` for synchronous access; queue writes if needed |
| V2 scope creep delaying V1 | Strict V1/V2 branch separation |

## License

Add your license here.