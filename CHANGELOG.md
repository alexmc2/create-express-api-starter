# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] - 2026-02-21
### Added
- Added package manager selection for dependency installation (`npm` or `yarn`) in interactive prompts and non-interactive runs.
- Added CLI flags for package manager control: `--package-manager`, `--pm`, and `--yarn`.
- Added parser and output test coverage for new package manager behavior and Yarn command rendering.

### Changed
- Updated dependency installation to execute the selected package manager command and to validate the selected executable only when installs are enabled.
- Updated next-step output to print package-manager-specific commands (`npm` vs `yarn`).
- Updated README options/flags documentation with package manager selection and Yarn usage examples.

## [0.1.6] - 2026-02-18
### Changed
- Refined README copy and structure for clearer, more natural release documentation and usage guidance.
- Corrected the main README dependency summary to match generated projects (Express 5).
- Updated generated TypeScript README folder trees to include `tsconfig.eslint.json` so docs match scaffolded output.

## [0.1.5] - 2026-02-18
### Added
- Added root ESLint configuration with `@typescript-eslint` and `@typescript-eslint/await-thenable` checks.
- Added `tsconfig.eslint.json` to generated TypeScript projects so type-aware ESLint rules can lint both `src/` and `__tests__/`.
- Added a CLI post-generation sanity check that verifies `package.json` exists before dependency installation begins.

### Changed
- Updated README installation/usage guidance to explicitly support standard npm initializer workflows: `npm create`, `npm init`, and `npx`.
- Refactored template resolution so TypeScript scaffolds are composed from `templates/ts/shared` plus architecture-specific overlays, removing duplicated TS template trees.
- Updated root CLI dependencies and generated template dependency versions across JavaScript and TypeScript scaffolds.
- Made the CLI `Postgres Setup` terminal card OS-aware with Linux, macOS, and Windows-specific guidance.
- Centralized database name normalization in a shared core helper and reused it across generator/template data and CLI output.

## [0.1.4] - 2026-02-18
### Changed
- Updated the Postgres (psql) next-steps setup label from `Linux first-time setup` to `First-time setup` so it no longer appears Linux-specific.

## [0.1.3] - 2026-02-18
### Changed
- Updated the README npm badge URL with a cache-busting query parameter so npm/GitHub badge rendering refreshes reliably after releases.

## [0.1.2] - 2026-02-18
### Changed
- Added a Postgres safety note in README clarifying local default DB credentials should be updated in `.env` before deployment.

## [0.1.1] - 2026-02-18
### Added
- Publish-readiness improvements for CI, release workflow, and npm metadata.
- npm release workflow now supports Trusted Publishing (OIDC) and tag-triggered publish automation.

### Changed
- README restructuring with explicit installation guidance prioritising `npx` over local `npm i`.

## [0.1.0] - 2026-02-17
### Added
- Initial release candidate of `@alexmc2/create-express-api-starter`.
- Interactive CLI scaffolding for JavaScript and TypeScript Express API projects.
- Template variants for simple and MVC architecture.
- Database modes: in-memory, Postgres (psql), and Postgres (Docker).
