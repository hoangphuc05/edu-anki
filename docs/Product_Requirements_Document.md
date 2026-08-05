# Product Requirements Document

## Cover Page

- Project Name: EduSpaced / anki-project
- Student(s): To Be Completed
- Course: CISC 593/594
- Semester: To Be Completed
- Repository URL: https://github.com/hoangphuc05/edu-anki.git
- Current Branch: feature/fsrs-engine
- Current Commit SHA: 353e36a8c9021f29c3f1e1aba71e1c6b66c7ae33
- Current Release Version: v0.0.3
- Document Version: 0.3
- Last Updated: 2026-08-04

## Revision History

| Version | Date | Git Commit | Description | Author |
|--------|------|------------|-------------|--------|
| 0.1 | 2026-07-21 | fac8df2a1a262c1fe7ffc324fa308254c327ec0e | Initial PRD created from repository evidence, existing documentation, and current implementation state. | Copilot |
| 0.2 | 2026-08-03 | 353e36a8c9021f29c3f1e1aba71e1c6b66c7ae33 | Updated to reflect the implemented authentication, deck/card CRUD, SQLite/Prisma persistence, and the FSRS-based SRS engine. Preserved prior content and version history. | Copilot |
| 0.3 | 2026-08-04 | (working tree) | Added a "Verifying Test(s)" column to the Requirements Traceability Matrix, mapping each FR-* to its automated test file(s). Added Section 18 documenting the automated traceability tooling (`docs/traceability-map.json`, `scripts/traceability.js`). | Copilot |

## Table of Contents

1. Product Vision
2. Product Scope
3. Software Capabilities
4. Undesirable Events
5. Risk Analysis
6. Risk Prioritization
7. Risk Mitigation
8. Functional Requirements
9. Quality Requirements
10. Performance Requirements
11. Assumptions
12. Constraints
13. External Interfaces
14. Requirements Traceability Matrix
15. Future Versions
16. Open Issues
17. Glossary
18. Requirements ↔ Test Traceability (Automation)

---

# 1. Product Vision

## Problem Statement

Learners who study with flashcards need review scheduling to be automated so that each card resurfaces right before it is likely to be forgotten. EduSpaced is a flashcard study application that schedules reviews automatically using the **FSRS** (Free Spaced Repetition Scheduler) algorithm via the `ts-fsrs` library. Instead of reviewing on a fixed calendar, each card's next review date is computed from the learner's rating and the card's current memory state.

The repository now contains a working implementation of the core foundation: user authentication, deck and card management with persistent SQLite storage, and an isolated, tested SRS engine that computes review schedules.

## Intended Users

- Learners who study with flashcards and want automated, adaptive review scheduling.
- Users who want to organize study content into decks and cards and track their review progress.

## Stakeholders

- Project maintainers and contributors
- Course instructors and reviewers
- End users of the flashcard application
- Repository maintainers tracking documentation, testing, and release readiness

## Product Goals

- Provide a working flashcard application with user accounts and persistent deck/card storage.
- Automate review scheduling using the FSRS algorithm so cards resurface at the right time.
- Keep the SRS scheduling logic isolated, pure, and fully unit tested.
- Maintain a maintainable monorepo structure shared between server, webapp, and shared types.
- Keep the implementation testable through automated unit and integration test suites.

## Major Features

The following features are implemented or documented:

- **Decks & cards** — create, edit, and organize flashcards into decks (implemented)
- **User authentication** — register, login, refresh, and logout with JWT access tokens and httpOnly refresh cookies (implemented)
- **Automatic scheduling** — an SRS engine wrapping `ts-fsrs` computes the next review date and updated FSRS state from a user rating (engine implemented; study-session API/UI To Be Completed)
- **Study sessions** — a focused question → reveal → rate loop (documented/planned)
- **Import / export** — bring cards in via CSV or JSON (documented/planned)
- **Dashboard** — cards due today, streaks, and review history (documented/planned)
- **V2 (planned)** — weak-deck recommendations and AI-assisted card generation from pasted text

## Planned Software Versions

- Version 1: Core study loop — authentication, deck/card CRUD, FSRS scheduling, and a study-session workflow. Partially implemented; the study-session API and UI remain To Be Completed.
- Version 2: Adaptive features — weak-deck recommendations and AI-assisted card generation from pasted text.
- Version 3: To Be Completed.

---

# 2. Product Scope

## Included Functionality

- User registration, login, token refresh, and logout with JWT-based authentication.
- Deck CRUD (create, read, update, delete) scoped to the authenticated user.
- Card CRUD (create, read, update, delete) within a user's deck, including tags.
- Persistent storage using SQLite via the Prisma ORM with `User`, `Deck`, `Card`, and `Review` models.
- Server-side request validation using shared Zod schemas.
- An isolated SRS engine (`packages/srs-engine`) that wraps `ts-fsrs` to compute next review dates and updated FSRS state from user ratings.
- A React/Vite webapp with routing, authentication context, and deck/card management UI.
- Automated unit and integration test suites for the server, webapp, and SRS engine.

## Excluded Functionality

- A completed study-session workflow (question → reveal → rate loop) is not yet implemented in the API or UI.
- Import/export workflows for flashcards (CSV/JSON) are not yet implemented.
- Dashboard analytics and review-history reporting are not yet implemented.
- AI-assisted card generation and weak-deck recommendation features are not yet implemented.
- The `Review` history model exists in the schema, but review recording through the study API is not yet wired up.

## Future Enhancements

The repository README documents the following future enhancements:

- Study-session workflows with a question → reveal → rate loop and optimistic UI updates.
- Import/export support for cards via CSV or JSON.
- Dashboard reporting (cards due today, streaks, review history).
- Advanced features such as weak-deck recommendations and AI-assisted card generation from pasted text.

---

# 3. Software Capabilities

## 3.1 Level-1 Capabilities

1. Manage User Accounts
2. Manage Decks
3. Manage Cards
4. Manage Review Scheduling
5. Serve Application Content
6. Validate Application Behavior
7. Document Product Information

## 3.2 Level-2 Capabilities

### 1. Manage User Accounts

1.1 Register User

1.2 Authenticate User

1.3 Refresh User Session

1.4 Log Out User

### 2. Manage Decks

2.1 Create Deck

2.2 List Decks

2.3 View Deck

2.4 Update Deck

2.5 Delete Deck

### 3. Manage Cards

3.1 Create Card

3.2 List Cards

3.3 View Card

3.4 Update Card

3.5 Delete Card

### 4. Manage Review Scheduling

4.1 Apply Spaced Repetition Scheduling

4.2 Preview Rating Outcomes

4.3 Track Review History

### 5. Serve Application Content

5.1 Start Application Server

5.2 Serve Static Web Assets

5.3 Support Client-Side Routing

### 6. Validate Application Behavior

6.1 Execute Server Tests

6.2 Execute Webapp Tests

6.3 Execute SRS Engine Tests

### 7. Document Product Information

7.1 Maintain Project Documentation

7.2 Track Project Risks

---

# 4. Undesirable Events

| UE ID | Level-2 Capability | Undesirable Event |
|------|--------------------|-------------------|
| UE-1.1-01 | Register User | A duplicate account is created for an email that already exists. |
| UE-1.1-02 | Register User | A user registers with an invalid email or a weak password. |
| UE-1.2-01 | Authenticate User | A user with the wrong password is able to log in. |
| UE-1.2-02 | Authenticate User | A valid user is unable to log in due to an authentication error. |
| UE-1.3-01 | Refresh User Session | A session with a bad or expired refresh token continues to be accepted. |
| UE-1.4-01 | Log Out User | Logout fails to clear the session and the user remains authenticated. |
| UE-2.1-01 | Create Deck | A deck is created with invalid or empty data. |
| UE-2.2-01 | List Decks | A user sees decks that do not belong to them. |
| UE-2.3-01 | View Deck | A user opens a deck that does not exist or is not owned by them. |
| UE-2.4-01 | Update Deck | A deck is updated with invalid data or the wrong deck is modified. |
| UE-2.5-01 | Delete Deck | Deleting a deck leaves orphaned cards or reviews behind. |
| UE-3.1-01 | Create Card | A card is created with invalid or empty question/answer data. |
| UE-3.2-01 | List Cards | Cards are listed for the wrong deck or include cards not owned by the user. |
| UE-3.3-01 | View Card | A user opens a card that does not exist or is not owned by them. |
| UE-3.4-01 | Update Card | A card is updated with invalid data or the wrong card is modified. |
| UE-3.5-01 | Delete Card | A card is deleted that the user does not own. |
| UE-4.1-01 | Apply Spaced Repetition Scheduling | Review schedules are computed incorrectly (overly aggressive or lenient). |
| UE-4.1-02 | Apply Spaced Repetition Scheduling | The SRS engine mutates its input card state or has side effects. |
| UE-4.2-01 | Preview Rating Outcomes | The preview of rating outcomes is incorrect or inconsistent with the applied schedule. |
| UE-4.3-01 | Track Review History | Review outcomes are not recorded accurately. |
| UE-5.1-01 | Start Application Server | The server fails to start and blocks local execution. |
| UE-5.2-01 | Serve Static Web Assets | Static web assets are not served correctly and the application cannot load. |
| UE-5.3-01 | Support Client-Side Routing | Route navigation fails and users cannot move between views. |
| UE-6.1-01 | Execute Server Tests | Server tests fail and regressions are not detected. |
| UE-6.2-01 | Execute Webapp Tests | Webapp tests fail and regressions are not detected. |
| UE-6.3-01 | Execute SRS Engine Tests | SRS engine tests fail and scheduling regressions are not detected. |
| UE-7.1-01 | Maintain Project Documentation | Project documentation becomes inconsistent and no longer reflects the repository. |
| UE-7.2-01 | Track Project Risks | Known risks are not documented or updated, delaying mitigation planning. |

---

# 5. Risk Analysis

| UE ID | Risk Statement | Likelihood | Impact | Risk Score |
|------|----------------|------------|--------|------------|
| UE-1.1-01 | If a duplicate account is created, user data may be confused or overwritten. | 2 | 3 | 6 |
| UE-1.1-02 | If invalid registration data is accepted, the account store becomes unreliable. | 2 | 2 | 4 |
| UE-1.2-01 | If a user with the wrong password logs in, private data may be exposed. | 1 | 5 | 5 |
| UE-1.2-02 | If a valid user cannot log in, the application becomes unusable for them. | 2 | 3 | 6 |
| UE-1.3-01 | If a bad or expired refresh token is accepted, sessions may be hijacked. | 1 | 5 | 5 |
| UE-1.4-01 | If logout fails to clear the session, the user remains authenticated unexpectedly. | 2 | 2 | 4 |
| UE-2.1-01 | If a deck is created with invalid data, the deck list becomes corrupted. | 2 | 2 | 4 |
| UE-2.2-01 | If a user sees another user's decks, private study content is exposed. | 1 | 4 | 4 |
| UE-2.3-01 | If a user opens a non-existent or unowned deck, the UI shows an error or wrong content. | 2 | 3 | 6 |
| UE-2.4-01 | If a deck is updated with invalid data or the wrong deck is modified, content is corrupted. | 2 | 3 | 6 |
| UE-2.5-01 | If deleting a deck leaves orphaned cards or reviews, queries fail or data is unreachable. | 2 | 4 | 8 |
| UE-3.1-01 | If a card is created with invalid data, study content becomes corrupted. | 2 | 2 | 4 |
| UE-3.2-01 | If cards are listed for the wrong deck, the user studies unintended content. | 2 | 3 | 6 |
| UE-3.3-01 | If a user opens a non-existent or unowned card, the UI shows an error or wrong content. | 2 | 3 | 6 |
| UE-3.4-01 | If a card is updated with invalid data or the wrong card is modified, content is corrupted. | 2 | 3 | 6 |
| UE-3.5-01 | If a card is deleted that the user does not own, another user's content is lost. | 1 | 4 | 4 |
| UE-4.1-01 | If review schedules are computed incorrectly, learners receive ineffective review timing. | 3 | 4 | 12 |
| UE-4.1-02 | If the SRS engine mutates its input or has side effects, scheduling becomes unpredictable. | 2 | 4 | 8 |
| UE-4.2-01 | If rating previews are incorrect, the user is misled about scheduling outcomes. | 2 | 3 | 6 |
| UE-4.3-01 | If review history is not recorded accurately, the study system misrepresents learner progress. | 2 | 4 | 8 |
| UE-5.1-01 | If the server fails to start, the application cannot be opened locally and delivery is blocked. | 2 | 4 | 8 |
| UE-5.2-01 | If static assets are not served correctly, users may see a blank page or broken UI. | 2 | 3 | 6 |
| UE-5.3-01 | If client-side routing fails, navigation and page transitions become unreliable. | 2 | 3 | 6 |
| UE-6.1-01 | If server tests fail, regressions in the backend may go undetected. | 3 | 3 | 9 |
| UE-6.2-01 | If webapp tests fail, regressions in the frontend may go undetected. | 3 | 3 | 9 |
| UE-6.3-01 | If SRS engine tests fail, scheduling regressions may go undetected. | 3 | 3 | 9 |
| UE-7.1-01 | If documentation is not kept current, the project becomes harder to maintain and review. | 3 | 2 | 6 |
| UE-7.2-01 | If risks are not tracked, mitigation planning may be incomplete. | 2 | 2 | 4 |

---

# 6. Risk Prioritization

| Priority | UE ID | Risk Score |
|----------|------|------------|
| 1 | UE-4.1-01 | 12 |
| 2 | UE-6.1-01 | 9 |
| 3 | UE-6.2-01 | 9 |
| 4 | UE-6.3-01 | 9 |
| 5 | UE-2.5-01 | 8 |
| 6 | UE-4.1-02 | 8 |
| 7 | UE-4.3-01 | 8 |
| 8 | UE-5.1-01 | 8 |
| 9 | UE-1.1-01 | 6 |
| 10 | UE-1.2-02 | 6 |
| 11 | UE-2.3-01 | 6 |
| 12 | UE-2.4-01 | 6 |
| 13 | UE-3.2-01 | 6 |
| 14 | UE-3.3-01 | 6 |
| 15 | UE-3.4-01 | 6 |
| 16 | UE-4.2-01 | 6 |
| 17 | UE-5.2-01 | 6 |
| 18 | UE-5.3-01 | 6 |
| 19 | UE-7.1-01 | 6 |
| 20 | UE-1.2-01 | 5 |
| 21 | UE-1.3-01 | 5 |
| 22 | UE-1.1-02 | 4 |
| 23 | UE-1.4-01 | 4 |
| 24 | UE-2.1-01 | 4 |
| 25 | UE-2.2-01 | 4 |
| 26 | UE-3.1-01 | 4 |
| 27 | UE-3.5-01 | 4 |
| 28 | UE-7.2-01 | 4 |

---

# 7. Risk Mitigation

| UE ID | Risk Mitigation | Classification |
|------|-----------------|----------------|
| UE-1.1-01 | Check for an existing user by email before creating an account and return a 409 conflict. | Pure Software |
| UE-1.1-02 | Validate registration input with shared Zod schemas (email format, password length) before persisting. | Pure Software |
| UE-1.2-01 | Compare the submitted password against the bcrypt hash only and return a generic 401 on mismatch. | Pure Software |
| UE-1.2-02 | Keep the login flow simple and covered by integration tests for valid credentials. | Pure Software |
| UE-1.3-01 | Verify the refresh token signature and expiry on every refresh and reject invalid tokens with 401. | Pure Software |
| UE-1.4-01 | Clear the httpOnly refresh cookie on logout and test the logout endpoint. | Pure Software |
| UE-2.1-01 | Validate deck creation with shared Zod schemas before persisting. | Pure Software |
| UE-2.2-01 | Scope all deck queries to the authenticated user id in the service layer. | Pure Software |
| UE-2.3-01 | Verify deck ownership before returning a deck and return 404 for missing/unowned decks. | Pure Software |
| UE-2.4-01 | Validate deck updates with shared Zod schemas and verify ownership before updating. | Pure Software |
| UE-2.5-01 | Declare explicit cascade relations in the Prisma schema and integration test deletion flows. | Pure Software |
| UE-3.1-01 | Validate card creation with shared Zod schemas before persisting. | Pure Software |
| UE-3.2-01 | Scope card queries to the owning deck and verify deck ownership in the service layer. | Pure Software |
| UE-3.3-01 | Verify card ownership via its deck before returning a card and return 404 otherwise. | Pure Software |
| UE-3.4-01 | Validate card updates with shared Zod schemas and verify ownership before updating. | Pure Software |
| UE-3.5-01 | Verify card ownership via its deck before deleting and return 404 otherwise. | Pure Software |
| UE-4.1-01 | Validate the SRS engine with focused unit tests covering new, young, and mature cards and all rating combinations. | Pure Software |
| UE-4.1-02 | Keep the SRS engine as pure functions that never mutate inputs and test for side effects. | Pure Software |
| UE-4.2-01 | Derive the preview from the same scheduler used for applied reviews and test consistency. | Pure Software |
| UE-4.3-01 | Record review outcomes atomically with the state update and verify history is persisted. | Pure Software |
| UE-5.1-01 | Add automated startup checks and keep server entry points simple and tested. | Pure Software |
| UE-5.2-01 | Verify static asset paths and ensure the app serves a valid fallback page. | Pure Software |
| UE-5.3-01 | Use generated router configuration and route tests to prevent broken navigation. | Pure Software |
| UE-6.1-01 | Maintain server tests for the current HTTP behavior and add regressions when behavior changes. | Pure Software |
| UE-6.2-01 | Maintain UI tests for the current webapp shell and key user-visible content. | Pure Software |
| UE-6.3-01 | Maintain SRS engine unit tests covering rating mapping, initialization, and edge cases. | Pure Software |
| UE-7.1-01 | Keep the PRD and README synchronized with the repository as the implementation evolves. | Pure Software |
| UE-7.2-01 | Update the risk management artifact whenever new risks are identified or mitigations change. | Pure Software |

---

# 8. Functional Requirements

| Requirement ID | Level-2 Capability | Functional Requirement |
|----------------|--------------------|------------------------|
| FR-1.1.1 | Register User | The Authentication Service shall register a new user with a valid email and password within one request. |
| FR-1.1.2 | Register User | The Authentication Service shall reject a duplicate email registration with a 409 conflict response. |
| FR-1.1.3 | Register User | The Authentication Service shall hash the user's password with bcrypt before storing it. |
| FR-1.2.1 | Authenticate User | The Authentication Service shall authenticate a registered user and issue an access token within one request. |
| FR-1.2.2 | Authenticate User | The Authentication Service shall reject invalid credentials with a 401 response. |
| FR-1.3.1 | Refresh User Session | The Authentication Service shall issue a new access token from a valid refresh token within one request. |
| FR-1.3.2 | Refresh User Session | The Authentication Service shall reject an invalid or expired refresh token with a 401 response. |
| FR-1.4.1 | Log Out User | The Authentication Service shall clear the session cookie and log the user out within one request. |
| FR-2.1.1 | Create Deck | The Deck Service shall create a deck for the authenticated user with a valid title within one request. |
| FR-2.2.1 | List Decks | The Deck Service shall list only the decks owned by the authenticated user. |
| FR-2.3.1 | View Deck | The Deck Service shall return a deck owned by the authenticated user, including its cards. |
| FR-2.4.1 | Update Deck | The Deck Service shall update the title or description of a deck owned by the authenticated user. |
| FR-2.5.1 | Delete Deck | The Deck Service shall delete a deck owned by the authenticated user and cascade to its cards and reviews. |
| FR-3.1.1 | Create Card | The Card Service shall create a card with a valid question, answer, and optional tags within a user's deck. |
| FR-3.2.1 | List Cards | The Card Service shall list the cards belonging to a deck owned by the authenticated user. |
| FR-3.3.1 | View Card | The Card Service shall return a card owned by the authenticated user via its deck. |
| FR-3.4.1 | Update Card | The Card Service shall update the question, answer, or tags of a card owned by the authenticated user. |
| FR-3.5.1 | Delete Card | The Card Service shall delete a card owned by the authenticated user via its deck. |
| FR-4.1.1 | Apply Spaced Repetition Scheduling | The SRS Engine shall compute the next review date and updated FSRS state from a card's current state and a user rating. |
| FR-4.1.2 | Apply Spaced Repetition Scheduling | The SRS Engine shall map UI ratings (again, hard, medium, easy) to the FSRS 1–4 scale. |
| FR-4.1.3 | Apply Spaced Repetition Scheduling | The SRS Engine shall return a sooner next review for a "hard" rating than for an "easy" rating. |
| FR-4.2.1 | Preview Rating Outcomes | The SRS Engine shall preview the scheduling outcome for every rating without applying any of them. |
| FR-4.3.1 | Track Review History | The planned product shall record review outcomes for each card. |
| FR-5.1.1 | Start Application Server | The Application Server shall start and listen on the configured port when executed. |
| FR-5.2.1 | Serve Static Web Assets | The Application Server shall serve static files from the webapp distribution directory when the files are present. |
| FR-5.3.1 | Support Client-Side Routing | The Web Application shall support route-based navigation through the generated router configuration. |
| FR-6.1.1 | Execute Server Tests | The server test suite shall execute through Vitest and validate current HTTP behavior. |
| FR-6.2.1 | Execute Webapp Tests | The webapp test suite shall execute through Vitest and validate rendered UI content. |
| FR-6.3.1 | Execute SRS Engine Tests | The SRS engine test suite shall execute through Vitest and validate scheduling behavior. |
| FR-7.1.1 | Maintain Project Documentation | The project shall maintain a living PRD and supporting project documentation. |
| FR-7.2.1 | Track Project Risks | The project shall maintain a risk management artifact that records identified risks and mitigations. |

---

# 9. Quality Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| QR-1 | Reliability | The server shall not return a 500 status for the current tested root and unknown-route requests. |
| QR-2 | Maintainability | The project shall keep source code, tests, and documentation in clearly separated locations within the repository. |
| QR-3 | Testability | The project shall provide automated test suites for server, webapp, and SRS engine behavior. |
| QR-4 | Security | Passwords shall be stored only as bcrypt hashes and never as plaintext. |
| QR-5 | Security | Protected routes shall reject requests with missing, invalid, or expired JWT access tokens with a 401 response. |
| QR-6 | Security | Deck and card operations shall be scoped to the authenticated user so users cannot access another user's data. |
| QR-7 | Usability | The webapp shall provide a navigable route shell and a basic user-visible home experience. |
| QR-8 | Portability | The project shall be runnable in a standard Node.js environment with the documented package manager. |
| QR-9 | Interoperability | The server and webapp shall remain compatible through the current Express and Vite integration pattern. |
| QR-10 | Maintainability | The SRS engine shall be implemented as pure functions with no side effects so it can be tested in isolation. |

---

# 10. Performance Requirements

| ID | Requirement |
|----|-------------|
| PR-1 | The server shall respond to the current root route within 2 seconds on a standard local development machine. |
| PR-2 | The webapp build shall complete successfully within 5 minutes in a standard development environment. |
| PR-3 | The application shall handle at least one concurrent request to the root route without returning a 500 status. |
| PR-4 | The SRS engine shall compute a review schedule for a single card within 100 milliseconds on a standard development machine. |
| PR-5 | Detailed performance targets for deck, card, and scheduling operations at scale are To Be Completed. |

---

# 11. Assumptions

- The project will continue to use Node.js and a package-manager-based workflow (pnpm).
- The repository will remain a monorepo containing a server, a webapp, shared types, and an SRS engine package.
- The current README and documentation reflect the intended product direction.
- The current implementation is a foundation and not yet a complete production-ready flashcard system.
- The study-session workflow, import/export, and dashboard features are planned but not yet implemented.
- The `Review` model exists in the schema but review recording through the study API is not yet wired up.

---

# 12. Constraints

- The current codebase uses ECMAScript modules.
- The server is implemented with Express and uses Prisma ORM with SQLite (via `better-sqlite3`).
- The webapp is implemented with React, Vite, Tailwind CSS, TanStack Router, and TanStack Query.
- Validation is performed with shared Zod schemas in the `shared-types` package.
- The SRS engine wraps the `ts-fsrs` library and is isolated in the `packages/srs-engine` package.
- Authentication uses JWT access tokens and httpOnly refresh cookies.
- The current repository does not yet implement the study-session API, import/export, or dashboard features.

---

# 13. External Interfaces

## User Interfaces

- A web-based interface rendered through React and Vite
- Authentication pages (login and register)
- Deck management pages (list, create, edit, delete)
- Card management within a deck (list, create, edit, delete)
- A home route and router-based navigation shell

## Hardware Interfaces

- None identified in the current repository snapshot

## Software Interfaces

- Express server exposing a REST API under `/api/auth`, `/api/decks`, and `/api/cards`
- SQLite database accessed through the Prisma ORM
- The `ts-fsrs` library wrapped by the `packages/srs-engine` package
- Shared Zod schemas in the `shared-types` package used by both server and webapp
- Browser-based client rendering through React
- Vitest-based test suites for server, webapp, and SRS engine behavior

## Communication Interfaces

- HTTP requests between the browser and the Express server
- JWT access tokens and httpOnly refresh cookies for session management
- Local development server execution over localhost

## External Services

- GitHub repository hosting
- To Be Completed: any external authentication, database, or AI service integrations

---

# 14. Requirements Traceability Matrix

Each functional requirement is traced to the automated test file(s) that verify it.
The mapping is maintained in `docs/traceability-map.json` and can be validated with
`node scripts/traceability.js` (see Section 18, "Requirements ↔ Test Traceability").

| Requirement ID | Level-2 Capability | Requirement Description | Verifying Test(s) |
|----------------|--------------------|------------------------|-------------------|
| FR-1.1.1 | Register User | The Authentication Service shall register a new user with a valid email and password within one request. | `server/__tests__/auth.test.js` |
| FR-1.1.2 | Register User | The Authentication Service shall reject a duplicate email registration with a 409 conflict response. | `server/__tests__/auth.test.js`, `server/__tests__/validate.test.js` |
| FR-1.1.3 | Register User | The Authentication Service shall hash the user's password with bcrypt before storing it. | `server/__tests__/auth.test.js` |
| FR-1.2.1 | Authenticate User | The Authentication Service shall authenticate a registered user and issue an access token within one request. | `server/__tests__/auth.test.js`, `webapp/src/__tests__/AuthContext.test.tsx` |
| FR-1.2.2 | Authenticate User | The Authentication Service shall reject invalid credentials with a 401 response. | `server/__tests__/auth.test.js` |
| FR-1.3.1 | Refresh User Session | The Authentication Service shall issue a new access token from a valid refresh token within one request. | `server/__tests__/auth.test.js`, `webapp/src/__tests__/AuthContext.test.tsx` |
| FR-1.3.2 | Refresh User Session | The Authentication Service shall reject an invalid or expired refresh token with a 401 response. | `server/__tests__/auth.test.js` |
| FR-1.4.1 | Log Out User | The Authentication Service shall clear the session cookie and log the user out within one request. | `server/__tests__/auth.test.js`, `webapp/src/__tests__/AuthContext.test.tsx` |
| FR-2.1.1 | Create Deck | The Deck Service shall create a deck for the authenticated user with a valid title within one request. | `server/__tests__/decks.test.js`, `webapp/src/__tests__/DecksRoute.test.tsx`, `webapp/src/__tests__/decksApi.test.ts` |
| FR-2.2.1 | List Decks | The Deck Service shall list only the decks owned by the authenticated user. | `server/__tests__/decks.test.js`, `webapp/src/__tests__/DecksRoute.test.tsx`, `webapp/src/__tests__/decksApi.test.ts` |
| FR-2.3.1 | View Deck | The Deck Service shall return a deck owned by the authenticated user, including its cards. | `server/__tests__/decks.test.js` |
| FR-2.4.1 | Update Deck | The Deck Service shall update the title or description of a deck owned by the authenticated user. | `server/__tests__/decks.test.js` |
| FR-2.5.1 | Delete Deck | The Deck Service shall delete a deck owned by the authenticated user and cascade to its cards and reviews. | `server/__tests__/decks.test.js`, `server/__tests__/schema.test.js`, `webapp/src/__tests__/DecksRoute.test.tsx`, `webapp/src/__tests__/decksApi.test.ts` |
| FR-3.1.1 | Create Card | The Card Service shall create a card with a valid question, answer, and optional tags within a user's deck. | `server/__tests__/cards.test.js`, `webapp/src/__tests__/DeckDetailRoute.test.tsx`, `webapp/src/__tests__/decksApi.test.ts` |
| FR-3.2.1 | List Cards | The Card Service shall list the cards belonging to a deck owned by the authenticated user. | `server/__tests__/cards.test.js` |
| FR-3.3.1 | View Card | The Card Service shall return a card owned by the authenticated user via its deck. | `server/__tests__/cards.test.js` |
| FR-3.4.1 | Update Card | The Card Service shall update the question, answer, or tags of a card owned by the authenticated user. | `server/__tests__/cards.test.js` |
| FR-3.5.1 | Delete Card | The Card Service shall delete a card owned by the authenticated user via its deck. | `server/__tests__/cards.test.js`, `webapp/src/__tests__/DeckDetailRoute.test.tsx` |
| FR-4.1.1 | Apply Spaced Repetition Scheduling | The SRS Engine shall compute the next review date and updated FSRS state from a card's current state and a user rating. | `packages/srs-engine/__tests__/scheduler.test.js`, `packages/srs-engine/__tests__/state.test.js`, `server/__tests__/study.test.js`, `webapp/src/__tests__/StudyRoute.test.tsx` |
| FR-4.1.2 | Apply Spaced Repetition Scheduling | The SRS Engine shall map UI ratings (again, hard, medium, easy) to the FSRS 1–4 scale. | `packages/srs-engine/__tests__/rating.test.js`, `server/__tests__/study.test.js` |
| FR-4.1.3 | Apply Spaced Repetition Scheduling | The SRS Engine shall return a sooner next review for a "hard" rating than for an "easy" rating. | `packages/srs-engine/__tests__/scheduler.test.js` |
| FR-4.2.1 | Preview Rating Outcomes | The SRS Engine shall preview the scheduling outcome for every rating without applying any of them. | `packages/srs-engine/__tests__/scheduler.test.js` |
| FR-4.3.1 | Track Review History | The planned product shall record review outcomes for each card. | `server/__tests__/study.test.js`, `server/__tests__/schema.test.js`, `webapp/src/__tests__/StudyRoute.test.tsx` |
| FR-5.1.1 | Start Application Server | The Application Server shall start and listen on the configured port when executed. | `server/__tests__/app.test.js`, `server/__tests__/study.test.js` |
| FR-5.2.1 | Serve Static Web Assets | The Application Server shall serve static files from the webapp distribution directory when the files are present. | `server/__tests__/app.test.js` |
| FR-5.3.1 | Support Client-Side Routing | The Web Application shall support route-based navigation through the generated router configuration. | `server/__tests__/app.test.js`, `webapp/src/__tests__/App.test.tsx`, `webapp/src/__tests__/IndexRoute.test.tsx` |
| FR-6.1.1 | Execute Server Tests | The server test suite shall execute through Vitest and validate current HTTP behavior. | `server/__tests__/app.test.js` |
| FR-6.2.1 | Execute Webapp Tests | The webapp test suite shall execute through Vitest and validate rendered UI content. | `webapp/src/__tests__/App.test.tsx` |
| FR-6.3.1 | Execute SRS Engine Tests | The SRS engine test suite shall execute through Vitest and validate scheduling behavior. | `packages/srs-engine/__tests__/scheduler.test.js` |
| FR-7.1.1 | Maintain Project Documentation | The project shall maintain a living PRD and supporting project documentation. | (no automated test — documentation requirement) |
| FR-7.2.1 | Track Project Risks | The project shall maintain a risk management artifact that records identified risks and mitigations. | (no automated test — documentation requirement) |

---

# 15. Future Versions

## Version 1

Version 1 is the core study loop: user authentication, deck and card management with persistent storage, FSRS-based review scheduling, and a study-session workflow. The authentication, deck/card CRUD, persistence, and SRS engine are implemented. The study-session API and UI (question → reveal → rate loop) remain To Be Completed.

## Version 2

The repository README describes planned adaptive features such as weak-deck recommendations and AI-assisted card generation from pasted text. These items are documented as important next steps but are not yet implemented.

## Version 3

Further enhancements are not yet implemented or documented beyond the README's references to analytics, import/export, and advanced recommendations. These items remain To Be Completed.

## Future Enhancements

- Study-session workflow with a question → reveal → rate loop and optimistic UI updates
- Import/export support for cards via CSV or JSON
- Dashboard and analytics features (cards due today, streaks, review history)
- Weak-deck recommendations
- AI-assisted card generation from pasted text

---

# 16. Open Issues

- The study-session API (`GET /api/study/due`, `POST /api/study/review`) described in the README is not yet implemented in the repository.
- The `Review` model exists in the Prisma schema, but review recording through the study API is not yet wired up.
- Import/export (CSV/JSON) workflows are documented but not implemented.
- Dashboard analytics and review-history reporting are documented but not implemented.
- Student name, course, and semester values are not available in the repository and are marked To Be Completed.
- The exact release plan and version milestones for future product phases are still To Be Completed.

---

# 17. Glossary

- PRD: Product Requirements Document
- Monorepo: A repository that contains multiple related projects or packages
- Vite: A frontend build tool and development server
- React: A JavaScript library for building user interfaces
- Express: A Node.js web framework for server-side applications
- Vitest: A test framework used for unit and integration-style test execution
- SPA: Single-page application
- FSRS: Free Spaced Repetition Scheduler, the algorithm used to compute review schedules
- ts-fsrs: The TypeScript library that implements the FSRS algorithm, wrapped by the SRS engine
- SRS: Spaced Repetition System
- Prisma: An ORM used to access the SQLite database
- SQLite: The embedded relational database used for persistence
- Zod: A schema validation library used for shared request validation
- JWT: JSON Web Token, used for access-token-based authentication
- bcrypt: A password-hashing function used to store passwords securely
- Deck: A collection of flashcards
- Card: An individual flashcard item
- Review: A record of a single rating outcome for a card
- UI rating: The learner-facing rating (again, hard, medium, easy) mapped to the FSRS 1–4 scale

---

# 18. Requirements ↔ Test Traceability (Automation)

To keep the traceability matrix accurate as the project evolves, the requirement-to-test
mapping is maintained as machine-readable data and validated by a script.

## Mapping data

`docs/traceability-map.json` maps every functional requirement ID (`FR-*`) to the test
file(s) that verify it. This is the single source of truth that the traceability matrix
in Section 14 is generated from.

## Validation script

`scripts/traceability.js` checks that:

1. Every mapped test file exists in the repository.
2. Every mapped test file actually contains at least one test case (`test(` or `it(`).
3. Every `FR-*` requirement in this PRD has an entry in the map (no unmapped requirements).
4. No map entries are stale (mapped but no longer present in the PRD).

Run it with:

```bash
node scripts/traceability.js        # human-readable report
node scripts/traceability.js --json # machine-readable JSON
```

The script exits with code `0` on success and `1` if any requirement is unmapped or a
mapped test file is missing/empty. It is intended to be wired into CI so that a PR that
adds a requirement without a test, or removes a mapped test file, fails the build.

## Current status

- PRD functional requirements: 31
- Mapped requirements: 31
- Unmapped: 0
- Stale entries: 0

> Documentation-only requirements (FR-7.1.1, FR-7.2.1) have no automated test mapped and
> are verified by review rather than by the test suite.
