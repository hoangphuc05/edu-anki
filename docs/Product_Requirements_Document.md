# Product Requirements Document

## Cover Page

- Project Name: EduSpaced / anki-project
- Student(s): To Be Completed
- Course: CISC 593/594
- Semester: To Be Completed
- Repository URL: https://github.com/hoangphuc05/edu-anki.git
- Current Branch: main
- Current Commit SHA: fac8df2a1a262c1fe7ffc324fa308254c327ec0e
- Current Release Version: 1.0.0
- Document Version: 0.1
- Last Updated: 2026-07-21

## Revision History

| Version | Date | Git Commit | Description | Author |
|--------|------|------------|-------------|--------|
| 0.1 | 2026-07-21 | fac8df2a1a262c1fe7ffc324fa308254c327ec0e | Initial PRD created from repository evidence, existing documentation, and current implementation state. | Copilot |

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

---

# 1. Product Vision

## Problem Statement

The repository currently contains a lightweight web application foundation and documentation for a more ambitious flashcard study product named EduSpaced. The implemented code provides a basic Express server, a Vite/React web application shell, and automated test scaffolding, while the repository documentation describes a planned spaced-repetition flashcard system.

## Intended Users

The documented product targets learners who study with flashcards and want review scheduling to be automated. The current repository does not yet include a completed user-management or study-workflow implementation.

## Stakeholders

- Project maintainers and contributors
- Course instructors and reviewers
- Future end users of the flashcard application
- Repository maintainers tracking documentation, testing, and release readiness

## Product Goals

- Establish a maintainable monorepo structure for a web application and server.
- Provide a working web application shell and server entry points.
- Document the intended flashcard study product and its risks.
- Keep the implementation testable through automated test suites.

## Major Features

The repository documentation identifies the following planned or documented features:

- Deck and card management
- Automatic review scheduling
- Study sessions with review feedback
- Import and export of cards
- Dashboard-style reporting

The current implementation in the repository is limited to a basic Express server, a Vite/React frontend shell, and test files.

## Planned Software Versions

- Version 1: To Be Completed
- Version 2: Planned in the documentation as a future release with adaptive or enhanced study features
- Version 3: To Be Completed

---

# 2. Product Scope

## Included Functionality

- A basic Express server that can start and serve a web application entry point
- A Vite-based React web application with route-based rendering
- Automated server and webapp test scaffolding using Vitest
- Project documentation, including a PRD, configuration guidance, and risk documentation

## Excluded Functionality

- Full authentication and user account management
- Persistent database-backed deck and card storage
- Complete spaced-repetition scheduling implementation
- Import/export workflows for flashcards
- Dashboard analytics and review-history reporting
- AI-assisted card generation and recommendation features

## Future Enhancements

The repository README documents the following future enhancements:

- Deck and card creation, editing, and organization
- Review scheduling based on a spaced-repetition engine
- Study-session workflows
- Import/export support
- Dashboard reporting
- Advanced features such as weak-deck recommendations and AI-assisted card generation

---

# 3. Software Capabilities

## 3.1 Level-1 Capabilities

1. Serve Application Content
2. Render User Interface
3. Manage Project Configuration
4. Validate Application Behavior
5. Document Product Information
6. Support Flashcard Study Workflows
7. Manage Review Scheduling

## 3.2 Level-2 Capabilities

### 1. Serve Application Content

1.1 Start Application Server

1.2 Serve Static Web Assets

### 2. Render User Interface

2.1 Render Home Route

2.2 Support Client-Side Routing

### 3. Manage Project Configuration

3.1 Configure Build and Tooling

3.2 Manage Dependencies and Scripts

### 4. Validate Application Behavior

4.1 Execute Server Tests

4.2 Execute Webapp Tests

### 5. Document Product Information

5.1 Maintain Project Documentation

5.2 Track Project Risks

### 6. Support Flashcard Study Workflows

6.1 Manage Decks and Cards

6.2 Support Review Sessions

### 7. Manage Review Scheduling

7.1 Apply Spaced Repetition Scheduling

7.2 Track Review History

---

# 4. Undesirable Events

| UE ID | Level-2 Capability | Undesirable Event |
|------|--------------------|-------------------|
| UE-1.1-01 | Start Application Server | The server fails to start and blocks local execution. |
| UE-1.2-01 | Serve Static Web Assets | Static web assets are not served correctly and the application cannot load. |
| UE-2.1-01 | Render Home Route | The home route renders an error state instead of a usable page. |
| UE-2.2-01 | Support Client-Side Routing | Route navigation fails and users cannot move between views. |
| UE-3.1-01 | Configure Build and Tooling | Build configuration breaks and prevents frontend or server development. |
| UE-3.2-01 | Manage Dependencies and Scripts | Dependency changes or script misconfiguration break install or test commands. |
| UE-4.1-01 | Execute Server Tests | Server tests fail and regressions are not detected. |
| UE-4.2-01 | Execute Webapp Tests | Webapp tests fail and regressions are not detected. |
| UE-5.1-01 | Maintain Project Documentation | Project documentation becomes inconsistent and no longer reflects the repository. |
| UE-5.2-01 | Track Project Risks | Known risks are not documented or updated, delaying mitigation planning. |
| UE-6.1-01 | Manage Decks and Cards | Deck or card data is not preserved or is lost during use. |
| UE-6.2-01 | Support Review Sessions | Review sessions cannot be completed reliably. |
| UE-7.1-01 | Apply Spaced Repetition Scheduling | Review schedules are computed incorrectly. |
| UE-7.2-01 | Track Review History | Review outcomes are not recorded accurately. |

---

# 5. Risk Analysis

| UE ID | Risk Statement | Likelihood | Impact | Risk Score |
|------|----------------|------------|--------|------------|
| UE-1.1-01 | If the server fails to start, the application cannot be opened locally and delivery is blocked. | 2 | 4 | 8 |
| UE-1.2-01 | If static assets are not served correctly, users may see a blank page or broken UI. | 2 | 3 | 6 |
| UE-2.1-01 | If the home route fails to render, the user cannot access the application entry point. | 2 | 3 | 6 |
| UE-2.2-01 | If client-side routing fails, navigation and page transitions become unreliable. | 2 | 3 | 6 |
| UE-3.1-01 | If build tooling is misconfigured, local development and packaging become difficult or impossible. | 2 | 4 | 8 |
| UE-3.2-01 | If dependencies or scripts are misconfigured, testing and development workflows break. | 2 | 3 | 6 |
| UE-4.1-01 | If server tests fail, regressions in the backend may go undetected. | 3 | 3 | 9 |
| UE-4.2-01 | If webapp tests fail, regressions in the frontend may go undetected. | 3 | 3 | 9 |
| UE-5.1-01 | If documentation is not kept current, the project becomes harder to maintain and review. | 3 | 2 | 6 |
| UE-5.2-01 | If risks are not tracked, mitigation planning may be incomplete. | 2 | 2 | 4 |
| UE-6.1-01 | If deck or card data cannot be preserved, learner progress and study content are at risk. | 2 | 5 | 10 |
| UE-6.2-01 | If review sessions cannot be completed, the core study experience is impaired. | 2 | 4 | 8 |
| UE-7.1-01 | If scheduling is computed incorrectly, learners may receive ineffective review timing. | 3 | 4 | 12 |
| UE-7.2-01 | If review history is not recorded accurately, the study system may misrepresent learner progress. | 2 | 4 | 8 |

---

# 6. Risk Prioritization

| Priority | UE ID | Risk Score |
|----------|------|------------|
| 1 | UE-7.1-01 | 12 |
| 2 | UE-4.1-01 | 9 |
| 3 | UE-4.2-01 | 9 |
| 4 | UE-6.1-01 | 10 |
| 5 | UE-1.1-01 | 8 |
| 6 | UE-3.1-01 | 8 |
| 7 | UE-6.2-01 | 8 |
| 8 | UE-7.2-01 | 8 |
| 9 | UE-1.2-01 | 6 |
| 10 | UE-2.1-01 | 6 |
| 11 | UE-2.2-01 | 6 |
| 12 | UE-3.2-01 | 6 |
| 13 | UE-5.1-01 | 6 |
| 14 | UE-5.2-01 | 4 |

---

# 7. Risk Mitigation

| UE ID | Risk Mitigation | Classification |
|------|-----------------|----------------|
| UE-1.1-01 | Add automated startup checks and keep server entry points simple and tested. | Pure Software |
| UE-1.2-01 | Verify static asset paths and ensure the app serves a valid fallback page. | Pure Software |
| UE-2.1-01 | Keep the home route implementation minimal and covered by webapp tests. | Pure Software |
| UE-2.2-01 | Use generated router configuration and route tests to prevent broken navigation. | Pure Software |
| UE-3.1-01 | Validate build configuration after dependency changes and keep documented setup steps. | Pure Software |
| UE-3.2-01 | Pin dependency versions where appropriate and run install and test scripts regularly. | Pure Software |
| UE-4.1-01 | Maintain server tests for the current HTTP behavior and add regressions when behavior changes. | Pure Software |
| UE-4.2-01 | Maintain UI tests for the current webapp shell and key user-visible content. | Pure Software |
| UE-5.1-01 | Keep the PRD and README synchronized with the repository as the implementation evolves. | Pure Software |
| UE-5.2-01 | Update the risk management artifact whenever new risks are identified or mitigations change. | Pure Software |
| UE-6.1-01 | Introduce persistent storage and validation for deck and card data in future implementation phases. | Pure Software |
| UE-6.2-01 | Define clear review-session flow requirements and test them before release. | Pure Software |
| UE-7.1-01 | Validate review scheduling logic with focused tests that cover common and edge cases. | Pure Software |
| UE-7.2-01 | Record review outcomes and verify that history is persisted and visible. | Pure Software |

---

# 8. Functional Requirements

| Requirement ID | Level-2 Capability | Functional Requirement |
|----------------|--------------------|------------------------|
| FR-1.1.1 | Start Application Server | The Application Server shall start on port 3000 by default when executed. |
| FR-1.2.1 | Serve Static Web Assets | The Application Server shall serve static files from the webapp distribution directory when the files are present. |
| FR-2.1.1 | Render Home Route | The Web Application shall render a root view without crashing in a browser environment. |
| FR-2.2.1 | Support Client-Side Routing | The Web Application shall support route-based navigation through the generated router configuration. |
| FR-3.1.1 | Configure Build and Tooling | The project shall provide Vite-based frontend build tooling and supporting configuration files. |
| FR-3.2.1 | Manage Dependencies and Scripts | The project shall provide package scripts for development, build, lint, and test workflows. |
| FR-4.1.1 | Execute Server Tests | The server test suite shall execute through Vitest and validate current HTTP behavior. |
| FR-4.2.1 | Execute Webapp Tests | The webapp test suite shall execute through Vitest and validate rendered UI content. |
| FR-5.1.1 | Maintain Project Documentation | The project shall maintain a living PRD and supporting project documentation. |
| FR-5.2.1 | Track Project Risks | The project shall maintain a risk management artifact that records identified risks and mitigations. |
| FR-6.1.1 | Manage Decks and Cards | The planned product shall support deck and card management workflows. |
| FR-6.2.1 | Support Review Sessions | The planned product shall support review-session workflows for learner feedback. |
| FR-7.1.1 | Apply Spaced Repetition Scheduling | The planned product shall compute review timing using spaced-repetition logic. |
| FR-7.2.1 | Track Review History | The planned product shall record review outcomes for each card. |

---

# 9. Quality Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| QR-1 | Reliability | The server shall not return a 500 status for the current tested root and unknown-route requests. |
| QR-2 | Maintainability | The project shall keep source code, tests, and documentation in clearly separated locations within the repository. |
| QR-3 | Testability | The project shall provide automated test suites for both server and webapp behavior. |
| QR-4 | Security | Authentication, authorization, and session security are To Be Completed because no implementation is present in the repository. |
| QR-5 | Usability | The webapp shall provide a navigable route shell and a basic user-visible home experience. |
| QR-6 | Portability | The project shall be runnable in a standard Node.js environment with the documented package manager. |
| QR-7 | Interoperability | The server and webapp shall remain compatible through the current Express and Vite integration pattern. |

---

# 10. Performance Requirements

| ID | Requirement |
|----|-------------|
| PR-1 | The server shall respond to the current root route within 2 seconds on a standard local development machine. |
| PR-2 | The webapp build shall complete successfully within 5 minutes in a standard development environment. |
| PR-3 | The application shall handle at least one concurrent request to the root route without returning a 500 status. |
| PR-4 | Detailed performance targets for deck, card, and scheduling operations are To Be Completed. |

---

# 11. Assumptions

- The project will continue to use Node.js and a package-manager-based workflow.
- The repository will remain a monorepo containing a server and a webapp.
- The current README and documentation reflect the intended product direction.
- The current implementation is a foundation and not a complete production-ready flashcard system.

---

# 12. Constraints

- The current codebase uses ECMAScript modules.
- The server is implemented with Express.
- The webapp is implemented with React, Vite, and TanStack Router.
- The current repository does not yet show a database layer, authentication system, or full spaced-repetition engine implementation.
- The project documentation references tools such as Prisma, Zod, and ts-fsrs, but these are not yet implemented in the current repository snapshot.

---

# 13. External Interfaces

## User Interfaces

- A web-based interface rendered through React and Vite
- A basic home route and router-based navigation shell

## Hardware Interfaces

- None identified in the current repository snapshot

## Software Interfaces

- Express server serving static web assets
- Browser-based client rendering through React
- Vitest-based test suites for server and webapp behavior

## Communication Interfaces

- HTTP requests between the browser and the Express server
- Local development server execution over localhost

## External Services

- GitHub repository hosting
- To Be Completed: any external authentication, database, or AI service integrations

---

# 14. Requirements Traceability Matrix

| Requirement ID | Level-2 Capability | Requirement Description |
|----------------|--------------------|------------------------|
| FR-1.1.1 | Start Application Server | The Application Server shall start on port 3000 by default when executed. |
| FR-1.2.1 | Serve Static Web Assets | The Application Server shall serve static files from the webapp distribution directory when present. |
| FR-2.1.1 | Render Home Route | The Web Application shall render a root view without crashing in a browser environment. |
| FR-2.2.1 | Support Client-Side Routing | The Web Application shall support route-based navigation through the generated router configuration. |
| FR-3.1.1 | Configure Build and Tooling | The project shall provide Vite-based frontend build tooling and supporting configuration files. |
| FR-3.2.1 | Manage Dependencies and Scripts | The project shall provide package scripts for development, build, lint, and test workflows. |
| FR-4.1.1 | Execute Server Tests | The server test suite shall execute through Vitest and validate current HTTP behavior. |
| FR-4.2.1 | Execute Webapp Tests | The webapp test suite shall execute through Vitest and validate rendered UI content. |
| FR-5.1.1 | Maintain Project Documentation | The project shall maintain a living PRD and supporting project documentation. |
| FR-5.2.1 | Track Project Risks | The project shall maintain a risk management artifact that records identified risks and mitigations. |
| FR-6.1.1 | Manage Decks and Cards | The planned product shall support deck and card management workflows. |
| FR-6.2.1 | Support Review Sessions | The planned product shall support review-session workflows for learner feedback. |
| FR-7.1.1 | Apply Spaced Repetition Scheduling | The planned product shall compute review timing using spaced-repetition logic. |
| FR-7.2.1 | Track Review History | The planned product shall record review outcomes for each card. |

---

# 15. Future Versions

## Version 1

Version 1 is represented by the current repository foundation: a basic Express server, a Vite/React webapp shell, and an initial test setup. The implementation is not yet a complete flashcard application.

## Version 2

The repository README describes planned study-centric functionality such as decks, cards, review scheduling, and study-session workflows. These items are documented as important next steps but are not yet implemented in the current repository snapshot.

## Version 3

Further enhancements are not yet implemented or documented beyond the README’s references to analytics, import/export, and advanced recommendations. These items remain To Be Completed.

## Future Enhancements

- Weak-deck recommendations
- AI-assisted card generation from pasted text
- Expanded dashboard and analytics features
- Broader import/export support

---

# 16. Open Issues

- The repository does not yet contain a completed flashcard study workflow implementation.
- Authentication, persistence, and database integration are not present in the current codebase snapshot.
- The README references tools and architecture that are not yet reflected in the current repository files.
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
- FSRS: Free Spaced Repetition Scheduler, referenced in the project README for future scheduling logic
- Deck: A collection of flashcards
- Card: An individual flashcard item
