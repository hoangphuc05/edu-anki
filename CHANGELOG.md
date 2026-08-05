# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases are tagged automatically by CI on merge to `main` (see
`.github/workflows/ci.yml`). This file is maintained manually alongside releases.

## [Unreleased]

### Added
- Docker support: `Dockerfile` and `docker-compose.yml` for running the app in a
  consistent containerized environment.
- `server/.env.example` template documenting required environment variables.
- Pull request template (`.github/PULL_REQUEST_TEMPLATE.md`).
- This `CHANGELOG.md`.

## [v0.0.6] - 2026-08-04

### Added
- Interactive study session backend and interface.

## [v0.0.5] - 2026-08-04

### Added
- Study backend (due-card queue and review submission).

## [v0.0.4] - 2026-08-04

### Changed
- Updated the Product Requirements Document.

## [v0.0.3] - 2026-08-04

### Added
- FSRS-based SRS engine (`packages/srs-engine`).

## [v0.0.2] - 2026-08-04

### Added
- Deck and card CRUD.

## [v0.0.1] - 2026-08-04

### Added
- Initial release: monorepo foundation, user authentication, database schema,
  and CI pipeline.
