# Baseline Inventory — Edu Anki (EduSpaced)

This document is the **baseline inventory** for the Edu Anki (EduSpaced) project. It
catalogs every established baseline so that any release or milestone can be traced to the
exact code, configuration, and documentation that shipped at that point.

A **baseline** is a fixed, reviewed snapshot of the project's configuration items (source
code, database schema, CI/CD workflow, documentation). Once a baseline is established,
changes are introduced only through the change-control process (feature branch → pull
request → merge to `main`).

## Baseline Policy

- **Working baseline:** The `main` branch is the current working baseline. Each merged
  pull request advances it.
- **Release baselines:** A release baseline is created automatically by CI on merge to
  `main` (see `.github/workflows/ci.yml`), which bumps a semver tag and publishes a GitHub
  Release with compiled artifacts.
- **Change control:** All changes to a baseline are made via pull requests; automated
  tests must pass before merging.

## Baseline Inventory

| Baseline | Tag | Commit SHA | Date | Contents / Scope | Status |
|---|---|---|---|---|---|
| v0.0.1 | `v0.0.1` | `a994b50` | 2026-08-03 | Monorepo foundation, user authentication, database schema (Prisma/SQLite), CI pipeline | Released |
| v0.0.2 | `v0.0.2` | `8060cb2` | 2026-08-03 | + Deck and card CRUD | Released |
| v0.0.3 | `v0.0.3` | `6b51f02` | 2026-08-03 | + FSRS-based SRS engine (`packages/srs-engine`) | Released |
| v0.0.4 | `v0.0.4` | `c59fe07` | 2026-08-03 | + Updated Product Requirements Document | Released |
| v0.0.5 | `v0.0.5` | `8e7aef9` | 2026-08-03 | + Study backend (due-card queue, review submission) | Released |
| v0.0.6 | `v0.0.6` | `cb33fa5` | 2026-08-03 | + Interactive study session backend and interface | Released |
| Working baseline | `main` | `cb33fa5` (HEAD) | current | Latest merged code on `main` | Active |

> **Note:** Commit SHAs are abbreviated (full SHAs available via `git rev-list -n1 <tag>`).
> The working baseline row reflects the current `main` HEAD at the time of writing.

## Rollback / Recovery

Because every release baseline is tagged, the project can be rolled back to any prior
release by checking out the corresponding tag (e.g., `git checkout v0.0.5`). The SQLite
database is a runtime artifact and is not version-controlled; database backups are the
responsibility of the deployment environment (see `docker-compose.yml` named volume).

## Revision History

| Version | Date | Summary of Changes |
|---|---|---|
| 1.0 | 2026-08-04 | Initial baseline inventory created from existing tags and merge history. |
