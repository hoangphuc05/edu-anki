# Configuration Management Report — Edu Anki (EduSpaced)

> **Living document.** This report is maintained as a living engineering artifact and is
> updated to reflect the *current* state of the repository, not its desired future state.
> Every claim below is based on repository evidence gathered on the review date.

## Document Revision History

| Version | Date | Summary of Changes |
|---|---|---|
| 1.0 | 2026-08-04 | Initial living CM report. Expanded the prior content of this file into a full report with revision history, repository metrics, configuration items, baseline, testing, CI/CD, release, dependency, traceability, risk, and maturity sections. |
| 1.1 | 2026-08-04 | Added Docker support (`Dockerfile`, `docker-compose.yml`), `server/.env.example` template, PR template (`.github/PULL_REQUEST_TEMPLATE.md`), and `CHANGELOG.md`. Reclassified these items from NOT IMPLEMENTED to IMPLEMENTED. |
| 1.2 | 2026-08-04 | Added baseline inventory document (`docs/BASELINE_INVENTORY.md`). Reclassified Baselines from PARTIALLY IMPLEMENTED to IMPLEMENTED. |
| 1.3 | 2026-08-04 | Implemented requirement↔test traceability: added `docs/traceability-map.json`, `scripts/traceability.js`, a "Verifying Test(s)" column to the PRD traceability matrix, and a "Verifying Test(s)" column to `docs/risk_management.csv`. Reclassified Traceability from PARTIALLY IMPLEMENTED to IMPLEMENTED. |
| 1.4 | 2026-08-04 | Added a `lint` job to `.github/workflows/ci.yml` and wired `scripts/traceability.js` into the `test` job as a required check; the `release` job now also runs `scripts/update_baseline_inventory.js` to auto-append each new tag to `docs/BASELINE_INVENTORY.md` instead of relying on a manual edit. Corrected README.md's Testing and CI/CD sections, which had claimed Playwright E2E tests, a Prettier format check, and Docker image builds in CI that do not exist, and added a README note documenting the required status checks and the still-outstanding GitHub branch-protection gap. |

> Note: The prior version of this file contained no version or revision history. Its
> accurate content (branching, change control, testing, release tagging, automation,
> source submission) has been preserved and incorporated below.

---

## 1. Executive Assessment

The Edu Anki (EduSpaced) repository is a **monorepo** containing a React/Vite webapp, an
Express server, and two shared workspace packages (`shared-types`, `srs-engine`). The
project demonstrates a **solid, working configuration management foundation**:

- **Version control is mature and PR-based.** All 33 commits are by a single author, and
  10 merge commits confirm a consistent feature-branch → pull request → merge workflow
  into `main`.
- **CI/CD is implemented.** `.github/workflows/ci.yml` runs unit tests on every push and
  pull request, and a release job auto-bumps a semver tag and publishes a GitHub Release
  with compiled artifacts on merge to `main`.
- **Automated testing is substantial.** 144 test cases across the server (7 files), webapp
  (7 files), and `srs-engine` (3 files).
- **Release tagging is implemented.** Tags `v0.0.1` through `v0.0.6` exist.
- **Documentation is present** (README, PRD, risk register, CM report, issue template).

The main gaps are **not yet implemented** items: no Dockerfile/docker-compose (despite
README references), no CHANGELOG.md, no `.env.example` template, no locally verifiable
branch-protection configuration, and no explicit baseline/rollback documentation.

---

## 2. Repository and Version Control Environment

- **Tool:** Git, hosted on GitHub.
- **Repository:** https://github.com/hoangphuc05/edu-anki
- **Remote:** `origin https://github.com/hoangphuc05/edu-anki.git`
- **Access:** The instructor has been granted access to the repository to review all source
  code and history.
- **Package manager:** pnpm (workspace monorepo, `pnpm-workspace.yaml`; `devEngines`
  pins pnpm 11.7.0).
- **Default branch:** `main` (`origin/HEAD -> origin/main`).

### Repository Metrics (as of 2026-08-04)

| Metric | Value |
|---|---|
| Total commits | 33 |
| Authors | 1 (Phuc Hoang `<chphuc05@gmail.com>`) |
| Merge commits | 10 |
| Tags | 6 (`v0.0.1` … `v0.0.6`) |
| Local branches | `main` + 7 `feature/*` |
| Remote branches | `main` + 9 `feature/*` |
| Test cases | 144 |
| Test files | 17 (server 7, webapp 7, srs-engine 3) |

---

## 3. Repository Structure

```
anki-project/
├── .github/
│   ├── ISSUE_TEMPLATE/new-feature.md   # New Feature issue template
│   ├── prompts/generate-prd.prompt.md  # PRD generation prompt
│   └── workflows/ci.yml                # CI + release workflow
├── components/shared-types/            # Shared Zod schemas (workspace package)
├── docs/
│   ├── Product_Requirements_Document.md
│   ├── configuration_management.md     # This report
│   ├── configuration_management_draft.md
│   ├── risk_management.csv
│   └── EduSpaced-Presentation-1.pptx
├── packages/
│   └── srs-engine/                     # FSRS scheduling engine (workspace package)
├── server/                             # Express backend
│   ├── prisma/schema.prisma
│   ├── src/ (db, middleware, routes, services, utils)
│   └── __tests__/ (7 test files)
├── webapp/                             # React + Vite frontend
│   └── src/__tests__/ (7 test files)
├── package.json                        # Workspace root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

---

## 4. Configuration Items (CIs)

Configuration items identified in the repository:

| CI | Location | Status |
|---|---|---|
| Source code (webapp) | `webapp/` | IMPLEMENTED |
| Source code (server) | `server/` | IMPLEMENTED |
| SRS engine package | `packages/srs-engine/` | IMPLEMENTED |
| Shared types package | `components/shared-types/` | IMPLEMENTED |
| Database schema | `server/prisma/schema.prisma` | IMPLEMENTED |
| CI/CD workflow | `.github/workflows/ci.yml` | IMPLEMENTED |
| Issue template | `.github/ISSUE_TEMPLATE/new-feature.md` | IMPLEMENTED |
| PRD | `docs/Product_Requirements_Document.md` | IMPLEMENTED |
| Risk register | `docs/risk_management.csv` | IMPLEMENTED |
| Traceability map | `docs/traceability-map.json` | IMPLEMENTED |
| Traceability script | `scripts/traceability.js` | IMPLEMENTED |
| CM report | `docs/configuration_management.md` | IMPLEMENTED |
| Baseline inventory | `docs/BASELINE_INVENTORY.md` | IMPLEMENTED |
| README | `README.md` | IMPLEMENTED |
| Dependency lockfile | `pnpm-lock.yaml` | IMPLEMENTED |
| Dockerfile | `Dockerfile` | IMPLEMENTED |
| docker-compose.yml | `docker-compose.yml` | IMPLEMENTED |
| CHANGELOG.md | `CHANGELOG.md` | IMPLEMENTED |
| `.env.example` template | `server/.env.example` | IMPLEMENTED |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` | IMPLEMENTED |

---

## 5. Branching Strategy

All new development is performed on dedicated `feature/*` branches, separate from `main`.
The `main` branch is intended to be protected and changed only via pull request.

Observed branches (local and/or remote):

- `main` (default)
- `feature/config`
- `feature/deck-and-card-crud`
- `feature/fsrs-engine`
- `feature/study-session-backend`
- `feature/tag-main`, `feature/tag-main-2`
- `feature/update-prd`
- `feature/add-unit-test-ci-cd` (remote)
- `feature/database-init` (remote)
- `feature/user-authentication` (remote)

Workflow (as documented and evidenced by merge history):

1. Create a feature branch from `main`:
   ```
   git checkout -b feature-branch
   ```
2. Make changes, then stage, commit, and push:
   ```
   git add .
   git commit -m "descriptive commit message"
   git push -u origin feature-branch
   ```
3. Once the feature is tested and working on the branch, merge it back to `main` via a
   pull request:
   - Go to https://github.com/hoangphuc05/edu-anki/pulls
   - Click **New Pull Request**, set base to `main` and compare to `feature-branch`
   - Add a descriptive title and description, then create the pull request.

> **Note:** Branch protection (e.g., required status checks, no direct pushes to `main`)
> is configured on GitHub and cannot be verified from the local repository. The 10 merge
> commits confirm the PR-based merge workflow is actually used.

---

## 6. Change Control Process

A formal change control process governs all changes introduced into the working baseline.

1. **Request:** A change is proposed and documented (feature, bug fix, or improvement).
   A New Feature issue template exists at `.github/ISSUE_TEMPLATE/new-feature.md`.
2. **Branch:** The change is developed on a new branch off `main`.
3. **Review:** A pull request is created and reviewed; automated unit tests run on every
   push and pull request (see `.github/workflows/ci.yml`).
4. **Manual testing:** The change is manually tested on the branch to verify it works as
   intended before merging.
5. **Approval:** The change is merged to `main` only after tests pass and review is approved.
6. **Baseline:** The merged code becomes the new working baseline.

---

## 7. Baseline Management

- **Working baseline:** The `main` branch represents the current working baseline. Each
  merged pull request advances the baseline (10 merge commits confirm this).
- **Release baselines:** Tags `v0.0.1` … `v0.0.6` mark release baselines. The CI release
  job auto-bumps the tag on merge to `main`.
- **Baseline inventory:** `docs/BASELINE_INVENTORY.md` catalogs every baseline (tag,
  commit SHA, date, scope, status) and documents the rollback/recovery procedure.
  Baseline management is therefore **IMPLEMENTED**.
- **Inventory now kept current automatically:** the previous gap ("Keep inventory current
  with each release" required a manual edit and could drift) is closed — the `release`
  job in `.github/workflows/ci.yml` now runs `scripts/update_baseline_inventory.js` after
  every new tag, appending a row to `docs/BASELINE_INVENTORY.md` and committing it back to
  `main` (`[skip ci]`) so the inventory can no longer fall out of sync with real tags.

---

## 8. Testing and Quality Gates

Two levels of testing are performed before a change is merged into the working baseline.

- **Automated testing:** Unit tests run automatically on every push and pull request via CI.
- **Manual testing:** Each feature is manually tested on its branch to confirm
  functionality, user flows, and edge cases behave correctly before the change is approved
  for merge.

### Test inventory (144 test cases across 17 files)

| Package | Test files | Coverage areas |
|---|---|---|
| `server` | `app`, `auth`, `cards`, `decks`, `schema`, `study`, `validate` | Auth/JWT, deck & card CRUD, DB schema, study/review flow, validation middleware |
| `webapp` | `App`, `AuthContext`, `DeckDetailRoute`, `decksApi`, `DecksRoute`, `IndexRoute`, `StudyRoute` | Rendering, auth context, API client, routes, study session UI |
| `srs-engine` | `rating`, `scheduler`, `state` | FSRS rating mapping, scheduling, card state |

> **Note:** The server tests use Supertest-style API tests against an in-memory/test
> SQLite DB, which is genuine integration-level coverage. E2E testing (Playwright) is
> **PLANNED / NOT IMPLEMENTED** in the repository — README.md previously claimed a
> `test:e2e` script and Playwright coverage that did not exist; this has been corrected
> in README.md to state plainly that E2E is planned, not shipped.

- **Quality gate enforcement:** automated tests, lint, and the traceability check now all
  run as required CI jobs (`test`, `lint`) on every push/PR (see Section 9); GitHub
  branch-protection rules that would block a merge on a failing check are still not
  configured (Section 13).

---

## 9. CI/CD and Automation

- **CI — `test` job:** `.github/workflows/ci.yml` — runs on every push and pull request
  to any branch. It sets up pnpm and Node 24, installs with `--frozen-lockfile`, generates
  the Prisma client, runs server and webapp unit tests, and now also runs
  `node scripts/traceability.js` so a PR that adds an unmapped requirement or removes a
  mapped test file fails the build instead of only being caught by a manual run.
- **CI — `lint` job (new):** runs on every push and pull request alongside `test`;
  installs dependencies and runs `pnpm --filter webapp lint` (ESLint). This closes the
  previously-identified gap where `eslint.config.js` existed but was never invoked by CI.
- **Release:** The `release` job (needs: `test`, `lint`) runs only on push to `main`. It:
  - Auto-bumps a semver tag via `mathieudutour/github-tag-action@v6.2` (conventional
    commits: `fix:` → patch, `feat:` → minor, BREAKING CHANGE → major; `default_bump: patch`).
  - Builds the webapp.
  - Packages `webapp/dist` and the server directory into zip release artifacts.
  - Publishes a GitHub Release via `softprops/action-gh-release@v2` with the zips attached.
  - Runs `scripts/update_baseline_inventory.js` and commits the updated
    `docs/BASELINE_INVENTORY.md` back to `main` (see Section 7).
- **Code review automation:** Pull requests trigger automated tests, lint, and the
  traceability check; failing checks are reported by GitHub but do not technically block
  merging to `main` yet, because no branch-protection rule requires them to pass (Section 13).

---

## 10. Release and Version Management

Once a version of the software is completed and tested, it is tagged with a release number.

- After a pull request is accepted, an automated workflow creates a new tag and increments
  the version (e.g., `v0.0.1` → `v0.0.2`).
- The workflow also creates a release containing compiled versions of the webapp and the
  server application.

### Existing tags

`v0.0.1`, `v0.0.2`, `v0.0.3`, `v0.0.4`, `v0.0.5`, `v0.0.6`

> **Note:** The CI release job uses `default_bump: patch`, so tags advance as `v0.0.x`.
> The README/PRD describe V1/V2 milestones; no `v1.0.0` tag exists yet.

---

## 11. Dependency and Environment Management

- **Package manager:** pnpm workspace monorepo (`pnpm-workspace.yaml`), with a committed
  `pnpm-lock.yaml` for reproducible installs (`--frozen-lockfile` in CI).
- **Workspace packages:** `webapp`, `server`, `components/shared-types`, `packages/srs-engine`.
- **Runtime pinning:** CI pins Node 24 and pnpm 11; `devEngines` pins pnpm 11.7.0.
- **Environment variables:** The server uses `dotenv` and reads `DATABASE_URL`, `JWT_*`
  env vars (per test conventions). A committed template at `server/.env.example` documents
  the required variables.
- **Docker:** `Dockerfile` and `docker-compose.yml` are now committed. The multi-stage
  Dockerfile builds the webapp and runs the Express server serving the compiled assets,
  with a named volume persisting the SQLite database. Docker-based environment management
  is therefore **IMPLEMENTED**.

---

## 12. Traceability and Audit Trail

- **Requirements:** `docs/Product_Requirements_Document.md` (PRD) includes a Requirements
  Traceability Matrix and revision history tied to git commits.
- **Risks:** `docs/risk_management.csv` maps risks to functional, preventative, and
  responsive requirements, and now includes a "Verifying Test(s)" column.
- **Change history:** Full git history (33 commits, 10 merges) provides an audit trail of
  all changes.
- **Automated traceability:** `docs/traceability-map.json` maps every FR-* requirement to
  its verifying test file(s), and `scripts/traceability.js` validates the mapping (missing
  test files, empty test files, unmapped requirements, stale entries). The PRD traceability
  matrix is generated from this mapping.
- **Traceability status:** IMPLEMENTED. Requirements, risks, and tests are linked through
  the traceability map and validated by the automated script.

---

## 13. Configuration Management Risks

| Risk | Likelihood | Impact | Mitigation / Status |
|---|---|---|---|
| Single author / bus factor | Medium | High | Only one author (33/33 commits). Recommend documenting handoff and review practices. |
| No `.env.example` template | Medium | Medium | Required env vars undocumented. Add a committed template. |
| No CHANGELOG.md | Medium | Low | Release notes are auto-generated by CI, but no maintained changelog. |
| Branch protection not configured on GitHub | Medium | Medium | `test` and `lint` are required CI jobs and README.md now documents them as the intended required status checks, but no GitHub branch-protection rule yet blocks a merge when they fail or requires review. **Still open** — must be enabled in repository settings, not fixable via a commit. |
| E2E testing referenced but not present | Medium | Medium | **RESOLVED (doc-only):** README.md previously claimed a `test:e2e` Playwright script; corrected to state E2E is planned, not implemented. Actual Playwright coverage is still not implemented. |
| Generated Prisma client not committed | Low | Medium | Must run `prisma generate` after clone/schema change (documented in repo notes). |
| Baseline inventory drift | Low | Low | **RESOLVED:** `scripts/update_baseline_inventory.js`, run by the `release` CI job, now appends each new tag to `docs/BASELINE_INVENTORY.md` automatically instead of relying on a manual edit. |

---

## 14. Technical Debt

- **Root `package.json` test script is a stub:** `"test": "echo \"Error: no test specified\" && exit 1"` — the root has no aggregate test runner; tests run per-package.
- **README/PRD drift:** README describes a structure (`apps/web`, `apps/server`, Turborepo/Nx, Docker, Playwright) that does not fully match the actual monorepo layout (`webapp/`, `server/`, pnpm).
- **ESLint scope:** webapp ESLint config only matches `**/*.{js,jsx}`; `.ts/.tsx` files are not linted.
- **No `tsconfig.json`** in webapp; type-checking relies on `vite build`.
- **No CHANGELOG.md** maintained.

---

## 15. Current Repository Maturity Assessment

| Area | Status | Evidence | Recommended Improvement |
|---|---|---|---|
| Version Control | IMPLEMENTED | Git + GitHub, 33 commits, clean history | Add conventional-commit enforcement |
| Branching | IMPLEMENTED | `main` + `feature/*`, 10 merge commits | Document branch-protection rules in repo |
| Change Control | IMPLEMENTED | PR-based workflow, issue template | Add PR template |
| Configuration Items | IMPLEMENTED | Source, schema, CI, docs, Docker, env template, CHANGELOG, PR template, baseline inventory tracked | — |
| Baselines | IMPLEMENTED | Tags v0.0.1–v0.0.6 + `docs/BASELINE_INVENTORY.md`, now auto-updated by the `release` CI job | Keep monitoring the auto-commit step as releases continue |
| Testing | IMPLEMENTED | 144 tests, 17 files | Add E2E (Playwright); README's overstated E2E claim is now corrected |
| CI/CD | IMPLEMENTED | `.github/workflows/ci.yml` (`test`, `lint`, `release` jobs) | Enable GitHub branch-protection so the required checks actually block a merge |
| Release Management | IMPLEMENTED | Auto-tag + GitHub Release + CHANGELOG + auto-updated baseline inventory | Reach v1.0.0 |
| Documentation | PARTIALLY IMPLEMENTED | README, PRD, risk, CM report | README's Testing/CI/CD drift fixed; Project Structure section still describes an unimplemented Turborepo/Nx layout |
| Traceability | IMPLEMENTED | PRD traceability matrix, risk CSV, `traceability-map.json`, `scripts/traceability.js`, now run as a required CI check | Keep the map updated as new requirements are added |
| Risk Management | IMPLEMENTED | `docs/risk_management.csv` | Keep register current with new risks |

---

## 16. Missing or Partially Implemented CM Artifacts

| Artifact | Status | Notes |
|---|---|---|
| Dockerfile / docker-compose.yml | IMPLEMENTED | Added 2026-08-04 |
| `.env.example` template | IMPLEMENTED | Added 2026-08-04 (`server/.env.example`) |
| CHANGELOG.md | IMPLEMENTED | Added 2026-08-04 |
| PR template | IMPLEMENTED | Added 2026-08-04 (`.github/PULL_REQUEST_TEMPLATE.md`) |
| Baseline inventory document | IMPLEMENTED | Added 2026-08-04 (`docs/BASELINE_INVENTORY.md`); auto-updated by CI as of v1.4 of this report |
| CI lint job | IMPLEMENTED | Added 2026-08-04 (`lint` job in `.github/workflows/ci.yml`, runs `pnpm --filter webapp lint`) |
| Traceability check in CI | IMPLEMENTED | Added 2026-08-04 (`node scripts/traceability.js` step in the `test` job) |
| Playwright E2E tests | NOT IMPLEMENTED | Referenced in README but absent; README corrected to say "planned" instead of claiming it exists |
| Branch-protection config (in-repo) | NOT IMPLEMENTED | Managed on GitHub, verified via API as `protected: false`; README now documents the intended required checks (`test`, `lint`), but the GitHub-side rule itself is still not configured |
| Root aggregate test runner | PARTIALLY IMPLEMENTED | Root `test` script is a stub |

---

## 17. Recommended Next Improvements

### High Priority
1. **Fix README's remaining Project Structure drift** so the documented layout (currently
   an unimplemented Turborepo/Nx `apps/web` structure) matches the actual monorepo —
   the Testing and CI/CD sections were already corrected in this revision. Affects: `README.md`.
2. **Add a root aggregate test script** so `pnpm test` runs all packages — improves the
   quality gate. Affects: root `package.json`.
3. **Enable GitHub branch protection on `main`** (require the `test` and `lint` checks,
   require review) — the checks now exist and README documents them as required, but
   GitHub itself still reports `protected: false`, so nothing actually blocks a merge yet.
   Affects: repository settings (not a file).

### Medium Priority
4. **Add Playwright E2E tests** to back up the "planned" note now in the README. Affects: `webapp/`.

~~Add a lint job to CI~~ — **DONE**: `lint` job added to `.github/workflows/ci.yml`.

~~Document branch-protection / required status checks in the repo~~ — **DONE**: README.md
now documents `test`/`lint` as the intended required checks (GitHub-side rule still open, see #3 above).

~~Wire the traceability script into CI~~ — **DONE**: `node scripts/traceability.js` now runs
as a step in the `test` job.

### Future Improvements
5. **Introduce conventional commits** and enforce them in CI for accurate auto-versioning.
6. **Add a second reviewer / documented review process** to reduce single-author risk.

---

## 18. Source Code Submission

The source code is submitted separately as a zip file, alongside this configuration
management report.
