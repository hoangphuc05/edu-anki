# Configuration Management Report — EduSpaced (edu-anki)

**Repository:** https://github.com/hoangphuc05/edu-anki
**Report status:** Living document, maintained alongside the repository.
**Prepared as of:** 2026-08-04 (branch `feature/config`, HEAD `be54771`)

---

## Document Revision History

| Version | Date | Summary of Changes |
|---|---|---|
| 1.0 | 2026-08-04 | Initial Configuration Management Report, based on direct inspection of repository history, branches, pull requests, releases, CI workflow, tests, and documentation. |

---

## 1. Executive Assessment

EduSpaced is a single-contributor monorepo (pnpm workspaces) implementing a spaced-repetition flashcard application (Express/Prisma/SQLite backend, React/Vite frontend, a standalone `srs-engine` package). The project shows **stronger-than-typical configuration management practices for a student/solo project**: every change on `main` has gone through a pull request, a CI workflow runs automated tests on every push/PR, and merges to `main` automatically create semantic-version tags and GitHub Releases with build artifacts.

The main gaps are structural rather than absent: there is no branch protection on GitHub (verified via the GitHub API — all branches, including `main`, report `protected: false`), all pull requests are authored and merged by a single account (no independent review), and the top-level `README.md` describes an aspirational architecture (Turborepo/Nx, `apps/web`, Playwright E2E) that does not match the actual repository layout (plain pnpm workspaces under `webapp/`, `server/`, `packages/`, `components/`; no `turbo.json`, `nx.json`, or Playwright config exist).

This report reflects the repository as it exists at the time of writing and is not a copy or continuation of any prior report — it was produced by direct re-inspection of the repository, GitHub branches, pull requests, releases, and workflow definitions.

## 2. Repository and Version Control Environment

- **VCS:** Git, hosted on GitHub at `hoangphuc05/edu-anki`.
- **Package manager / monorepo tool:** pnpm workspaces (`pnpm-workspace.yaml`), pinned via `devEngines.packageManager` in [package.json](../package.json) to pnpm `11.7.0`. No Turborepo/Nx despite being mentioned in [README.md](../README.md).
- **Commits on `main`:** 33 (single author: `Phuc Hoang` / `hoangphuc05`). 10 of these are merge commits, one per merged pull request.
- **Total commits across all local/remote branches:** 37 (the extra 4 are in-progress feature-branch commits not yet merged).
- **Commit message quality:** Mixed. Some merge/PR titles follow a semi-conventional style (`feat:`, `Feat:`), but many direct commits are terse and non-descriptive (e.g. `untested`, `fix test`, `add styling, fix database`). No enforced commit message convention (no commitlint, no commit-msg hook).
- **Single contributor:** All 11 pull requests (#10–#20) are authored by `hoangphuc05`; there are no external reviewers or co-authors. This limits the "four-eyes" value of the PR process but the workflow itself (branch → PR → CI → merge) is real and consistently followed.

## 3. Repository Structure

Monorepo with pnpm workspaces (`pnpm-workspace.yaml`):

```
components/shared-types/   # shared Zod validation schemas (client + server)
packages/srs-engine/       # FSRS scheduling engine wrapper (ts-fsrs), own tests
server/                    # Express API, Prisma/SQLite, routes/services/middleware, __tests__/
webapp/                    # React + Vite frontend, TanStack Router/Query, __tests__/
docs/                      # PRD, risk register, baseline inventory, traceability map, this report
scripts/                   # traceability.js, update_risk_traceability.js
.github/workflows/ci.yml   # CI: test + auto-tag/release
```

This matches what the tech-stack table in README.md describes for languages/frameworks, but **not** the "Project Structure" section of README.md, which documents an `apps/web` / `apps/server` Turborepo layout that was never implemented. This is a documentation-accuracy gap, not a functional one.

## 4. Configuration Items (CIs)

Verified, version-controlled CIs:

| CI Category | Items |
|---|---|
| Application source | `server/src/**`, `webapp/src/**`, `packages/srs-engine/src/**`, `components/shared-types/index.js` |
| Database schema | `server/prisma/schema.prisma` (SQLite) |
| Build/runtime config | [Dockerfile](../Dockerfile) (2-stage build), [docker-compose.yml](../docker-compose.yml), `package.json` files, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vite.config.js`, `vitest.config.ts`, `eslint.config.js` |
| CI/CD definition | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| Environment template | `server/.env.example` (PORT, DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY) |
| Requirements/traceability | `docs/Product_Requirements_Document.md`, `docs/traceability-map.json`, `docs/risk_management.csv` |
| Baseline record | `docs/BASELINE_INVENTORY.md` |
| Release history | `CHANGELOG.md`, GitHub Releases v0.0.1–v0.0.6 |
| Process templates | `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/new-feature.md`, `.github/prompts/generate-prd.prompt.md` |

Not a CI: generated code is explicitly excluded — `server/src/generated/prisma/**` (Prisma client) and `webapp/src/routeTree.gen.ts` (TanStack Router) are regenerated from schema/routes rather than hand-maintained (confirmed present in the working tree but produced by `prisma generate` / `vite build`, not manually edited).

## 5. Branching Strategy

- **PARTIALLY IMPLEMENTED / consistent in practice.** Pattern observed: `main` (protected in intent, not in GitHub settings) + short-lived `feature/*` branches, one per unit of work: `feature/config`, `feature/deck-and-card-crud`, `feature/fsrs-engine`, `feature/study-session-backend`, `feature/tag-main`, `feature/tag-main-2`, `feature/update-prd`, plus remote-only `feature/add-unit-test-ci-cd`, `feature/database-init`, `feature/user-authentication`.
- No branching-strategy document exists (no `CONTRIBUTING.md` defining it); the pattern is inferred purely from branch names and PR history, not from a written policy.
- No `develop`/release branches — every feature branch merges directly to `main`.

## 6. Change Control Process

- **IMPLEMENTED.** All 33 commits on `main` arrived via one of 11 pull requests (#10–#20 on GitHub); 10 are merged, 1 (`#20`, "update CM, add artifact", `feature/config` → `main`) is currently open at the time of this report.
- A pull request template ([.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md)) and a feature-request issue template ([.github/ISSUE_TEMPLATE/new-feature.md](../.github/ISSUE_TEMPLATE/new-feature.md)) exist and structure how changes are proposed.
- **PARTIALLY IMPLEMENTED — no independent review.** Every PR is authored and merged by the same GitHub account (`hoangphuc05`); there is no evidence of a second reviewer or required-review rule.
- **NOT IMPLEMENTED — branch protection.** Verified via the GitHub API (`list_branches`): every branch, including `main`, reports `"protected": false`. Merges to `main` are not currently gated by GitHub branch-protection rules (the CI `test` job runs on PRs, but nothing in the repository forces it to pass before merge is allowed).

## 7. Baseline Management

- **IMPLEMENTED.** [docs/BASELINE_INVENTORY.md](BASELINE_INVENTORY.md) catalogs the 6 tagged baselines (v0.0.1–v0.0.6) with commit SHA, date, and scope, plus the current working baseline on `main`.
- Tags are created automatically by CI (`mathieudutour/github-tag-action@v6.2`) on every push to `main`, not manually.
- GitHub Releases exist for all 6 tags (confirmed via the GitHub API), each auto-generated by `softprops/action-gh-release@v2` with `generate_release_notes: true`, and each attaches two build artifacts: `webapp-dist-<tag>.zip` and `server-<tag>.zip`.

## 8. Testing and Quality Gates

- **IMPLEMENTED.** 13 test files across three packages, all runnable via each package's `pnpm test`:
  - `server/__tests__/` — 6 files (`app`, `auth`, `cards`, `decks`, `schema`, `study`, `validate` — 7 files total).
  - `webapp/src/__tests__/` — 7 files (`App`, `AuthContext`, `DeckDetailRoute`, `decksApi`, `DecksRoute`, `IndexRoute`, `StudyRoute`).
  - `packages/srs-engine/__tests__/` — 3 files (`rating`, `scheduler`, `state`).
- CI (`.github/workflows/ci.yml`) runs `pnpm --filter server test` and `pnpm --filter webapp test` on every push and pull request to any branch. The `srs-engine` package's own test suite is **not** independently invoked in CI (it is only exercised indirectly through `server`'s dependency on it).
- **PARTIALLY IMPLEMENTED — quality gate enforcement.** Because there is no branch protection, a failing `test` job does not technically block a PR from being merged on GitHub, even though the workflow itself will report a failed check.
- No coverage reporting or coverage thresholds are configured.

## 9. CI/CD and Automation

- **IMPLEMENTED.** [.github/workflows/ci.yml](../.github/workflows/ci.yml) defines two jobs:
  - `test`: runs on every push/PR to any branch (`branches: ['**']`) — installs deps with `pnpm install --frozen-lockfile`, generates the Prisma client, runs server and webapp test suites.
  - `release` (needs: `test`): runs only on push to `main` — builds the webapp, bumps a semver tag via `mathieudutour/github-tag-action@v6.2` from conventional-commit-style messages (`fix:`→patch, `feat:`→minor, `BREAKING CHANGE`→major, default `patch`), zips `webapp/dist` and the `server/` directory (excluding `node_modules` and local `*.db` files), and publishes a GitHub Release via `softprops/action-gh-release@v2`.
- Only one workflow file exists; there is no separate lint job, no Docker image build/publish step in CI, and no scheduled/nightly workflow.
- `scripts/traceability.js` (requirement↔test mapping validator) exists and passes when run locally (`node scripts/traceability.js` → 31/31 mapped, 0 unmapped, 0 stale) but is **not** wired into the CI workflow.

## 10. Release and Version Management

- **IMPLEMENTED.** 6 tags (`v0.0.1`–`v0.0.6`) and 6 matching GitHub Releases exist, all authored by `github-actions[bot]` (confirmed via the GitHub API), each linked to the merged PR(s) that produced it.
- [CHANGELOG.md](../CHANGELOG.md) follows the Keep a Changelog format and is maintained manually, with entries up to v0.0.6 plus an `[Unreleased]` section; it is not auto-generated from the release notes, so it can drift from the GitHub Release notes if not updated per change.
- Root `package.json` version field (`1.0.0`) is static and disconnected from the auto-incrementing git tags (currently at `v0.0.6`) — this is a minor inconsistency between two version sources.

## 11. Dependency and Environment Management

- **IMPLEMENTED.** `pnpm-lock.yaml` is committed, and CI uses `pnpm install --frozen-lockfile`, ensuring reproducible installs.
- `server/.env.example` documents all required environment variables without committing real secrets; `.gitignore` excludes `.env` and local SQLite `*.db` files.
- **IMPLEMENTED.** [Dockerfile](../Dockerfile) (multi-stage: webapp build stage + Alpine runtime stage running the Express server) and [docker-compose.yml](../docker-compose.yml) (single service, named volume for the SQLite database at `/app/server/prisma`) provide a reproducible runtime environment.
- No Dependabot/Renovate configuration exists for automated dependency updates.

## 12. Traceability and Audit Trail

- **IMPLEMENTED.** [docs/traceability-map.json](traceability-map.json) maps all 31 functional requirements from the PRD (`docs/Product_Requirements_Document.md`, Section 14) to the test files that verify them; `scripts/traceability.js` validates the map against the actual PRD and test files on disk (currently passing: 31 mapped, 0 unmapped, 0 stale).
- [docs/risk_management.csv](risk_management.csv) (18 identified risks) includes a "Verifying Test(s)" column cross-referencing risks to tests.
- Audit trail for changes is the combination of git history + PR history + GitHub Releases (each release lists the PR(s) it contains via auto-generated release notes) — this is real, inspectable evidence, not a separate audit log.
- Gap: the traceability validator is not run in CI, so drift between the PRD, the map, and the test suite would only be caught manually.

## 13. Configuration Management Risks

1. **No branch protection** — `main` can be force-pushed or merged without passing CI, despite the workflow existing (verified `protected: false` via GitHub API).
2. **Single point of failure / no independent review** — one contributor authors and merges every PR; no second reviewer catches defects before merge.
3. **README/architecture drift** — README.md describes an `apps/web` Turborepo/Nx/Playwright structure that doesn't exist, risking confusion for new contributors.
4. **Dual version identifiers** — root `package.json` version (`1.0.0`) is not kept in sync with the CI-managed git tags (`v0.0.6`), which could mislead consumers of the package metadata.
5. **Generated artifacts not regenerated automatically outside CI** — `server/src/generated/prisma` and `webapp/src/routeTree.gen.ts` must be manually regenerated after a fresh clone or schema/route change; forgetting this causes local test/build failures (this is a known repo gotcha, not merely theoretical).
6. **No dependency-update automation** — without Dependabot/Renovate, security patches in dependencies rely entirely on manual review.

## 14. Technical Debt

- `srs-engine` tests are not run in CI, even though the package is a dependency of `server`.
- No coverage tracking, so regressions in untested code paths are not visible.
- No lint step in CI (an `eslint.config.js` exists in `webapp/` but is not invoked by any workflow); it also only targets `**/*.{js,jsx}`, so `.ts`/`.tsx` files are unlinted.
- No `tsconfig.json` in `webapp/`, so there is no standalone `tsc --noEmit` type-check step anywhere (type errors are only surfaced incidentally by `vite build`).
- `CHANGELOG.md` is manually maintained and could silently fall out of sync with the auto-generated GitHub Release notes.

## 15. Current Repository Maturity Assessment

| Area | Status | Evidence | Recommended Improvement |
|---|---|---|---|
| Version Control | IMPLEMENTED | Git + GitHub, 37 commits, single-author history, `.gitignore` excludes secrets/build artifacts | Add a `CONTRIBUTING.md` documenting the workflow already in practice |
| Branching | PARTIALLY IMPLEMENTED | Consistent `feature/*` → `main` pattern across 10 branches, but undocumented and unenforced | Document the branching convention; consider protecting `main` |
| Change Control | PARTIALLY IMPLEMENTED | 11 PRs (#10–#20), PR + issue templates exist | Require review before merge; enable required-status-checks |
| Configuration Items | IMPLEMENTED | Source, schema, Docker, CI, env template, docs all version-controlled | Track generated-file regeneration steps in a `CONTRIBUTING.md` |
| Baselines | IMPLEMENTED | `docs/BASELINE_INVENTORY.md`, 6 tags, 6 GitHub Releases (verified via API) | Keep inventory updated as new tags are cut |
| Testing | PARTIALLY IMPLEMENTED | 13 test files, CI runs server+webapp suites | Add `srs-engine` test job to CI; add coverage reporting |
| CI/CD | IMPLEMENTED | `.github/workflows/ci.yml` (`test` + `release` jobs), verified via 6 real releases | Add lint job; wire `scripts/traceability.js` into CI |
| Release Management | IMPLEMENTED | 6 semver tags, 6 GitHub Releases with build artifacts, `CHANGELOG.md` | Sync root `package.json` version with git tags |
| Documentation | PARTIALLY IMPLEMENTED | README, PRD, risk register, baseline inventory, this report all exist | Correct README's Project Structure section to match actual layout |
| Traceability | IMPLEMENTED | `docs/traceability-map.json` + `scripts/traceability.js` (31/31 mapped, passing) | Run the traceability check in CI |
| Risk Management | IMPLEMENTED | `docs/risk_management.csv`, 18 risks, verifying-test column | Re-review risk register each time a new feature branch merges |

## 16. Missing or Partially Implemented CM Artifacts

- Branch protection rules on `main` (required status checks, required review) — not configured on GitHub.
- `CONTRIBUTING.md` documenting the branching/PR/commit conventions already followed in practice.
- CI job for `packages/srs-engine`'s own test suite.
- Lint/type-check step in CI.
- Dependabot/Renovate configuration for dependency updates.
- Coverage reporting/thresholds.
- Correction of README.md's "Project Structure" section (describes a Turborepo/Nx layout that does not exist in this repository).

## 17. Recommended Next Improvements

### High Priority
- **Enable branch protection on `main`** (require the CI `test` job to pass, require at least one PR review or approval) — repository evidence shows CI exists but cannot currently block a broken merge; this is the single highest-leverage control gap given `protected: false` is confirmed via the GitHub API. Affects: GitHub repository settings (not a repo file).
- **Add `srs-engine` to the CI test matrix** — the package is a real runtime dependency of `server` but its own test suite is never run in CI; a regression could ship unnoticed. Affects: [.github/workflows/ci.yml](../.github/workflows/ci.yml).
- **Wire `scripts/traceability.js` into CI** — the validator already exists and passes locally; running it automatically prevents PRD/test drift from going unnoticed. Affects: [.github/workflows/ci.yml](../.github/workflows/ci.yml).

### Medium Priority
- **Add a lint/type-check CI job** — `eslint.config.js` exists but is not invoked by CI, and `.ts`/`.tsx` files are not linted at all. Affects: [.github/workflows/ci.yml](../.github/workflows/ci.yml), `webapp/eslint.config.js`.
- **Correct README.md's Project Structure section** to reflect the actual pnpm-workspace layout instead of the unimplemented Turborepo/Nx/`apps/web` structure. Affects: [README.md](../README.md).
- **Add a `CONTRIBUTING.md`** documenting the branch/PR workflow that is already followed, so it is enforceable/teachable rather than tribal knowledge. Affects: new file `CONTRIBUTING.md`.
- **Reconcile version identifiers** — align root `package.json`'s `version` field with the CI-managed git tag, or document why they are intentionally decoupled. Affects: [package.json](../package.json).

### Future Improvements
- Add automated dependency updates (Dependabot or Renovate) once the project has more surface area to patch.
- Add coverage reporting/thresholds as the test suite grows.
- Consider a second reviewer/maintainer once the project has more than one contributor, to make the existing PR process a genuine review gate.

## 18. Recommended Next Commits

Commit 1:
`docs: rewrite CM report from direct repository inspection (v1.0)`

Commit 2:
`ci: run srs-engine test suite in CI`

Commit 3:
`ci: run scripts/traceability.js as a CI check`

Commit 4:
`docs: correct README project-structure section to match actual layout`

Commit 5:
`docs: add CONTRIBUTING.md documenting branch/PR workflow`

*(GitHub branch-protection configuration is a repository-settings change, not a file commit, and should be applied directly in GitHub settings rather than through a commit.)*

