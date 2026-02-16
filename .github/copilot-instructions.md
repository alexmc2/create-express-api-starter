# Copilot Code Review Instructions

## Project overview

This is `@alexmc2/create-express-api-starter` — a TypeScript + ESM scaffolding CLI that generates beginner-friendly Express API projects from EJS templates. It is **not** a runtime framework; it produces standalone projects and exits.

There are two distinct code surfaces:

1. **CLI source** (`src/`) — TypeScript, ESM, built with tsup, tested with Vitest.
2. **EJS templates** (`templates/`) — generate CommonJS JavaScript or TypeScript projects using Express 4, Jest, Supertest, and optionally `pg`.

---

## Architecture rules

### Two-layer separation

- The CLI (`src/`) must never import Express, Jest, pg, or any dependency of the **generated** project.
- Templates (`templates/`) must never reference CLI internals. They receive data only through the EJS render context defined in `src/generator/index.ts → templateData()`.
- New template data variables must be added to `templateData()` and documented in `BASELINE_REPORT.md` section 4.

### Module boundaries within `src/`

- `src/cli/` handles argv parsing, prompts, output formatting, and orchestration (`index.ts`).
- `src/core/` holds types, defaults, labels, and validation — **no side effects, no I/O**.
- `src/generator/` handles template planning, filtering, EJS rendering, and file writing.
- `src/utils/` provides logging, path resolution, command execution, and filesystem guards.
- Do not introduce circular imports between these directories.

### Type system

- All shared interfaces live in `src/core/types.ts`. New types that cross module boundaries go here.
- Use union string literal types (`Language`, `Architecture`, `DatabaseMode`) — not enums.
- Avoid `any`. Prefer `unknown` with narrowing when the type is genuinely dynamic.

---

## Code style and conventions

### General

- Strict TypeScript (`"strict": true`). Do not add `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- ESM throughout (`"type": "module"` in package.json). Internal imports use `.js` extensions even for `.ts` files (TypeScript ESM convention).
- Named exports preferred. Default exports only where the module is a single primary value (e.g., `export default app` in templates).
- Use `node:` protocol for Node built-ins (`import path from 'node:path'`).
- Functions should be small and single-purpose. If a function exceeds ~40 lines, consider extracting helpers.
- Use `const` by default. Use `let` only when reassignment is necessary. Never use `var`.

### Naming

- Files: `camelCase.ts` for source, `camelCase.js.ejs` for templates.
- Functions: `camelCase`. Use verbs for actions (`parseArgs`, `resolveTargetDir`) and adjective/noun patterns for predicates (`isEjsTemplate`, `shouldIncludeTemplate`).
- Types/Interfaces: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for true compile-time constants, `camelCase` for runtime config objects.

### Error handling

- Throw descriptive `Error` instances with user-facing messages. The top-level CLI handler in `src/cli/index.ts` catches and formats them.
- `PromptCancelledError` is the dedicated cancellation signal — do not repurpose it.
- Never swallow errors silently. If `catch` doesn't rethrow, it must log or handle meaningfully.

### Logging

- Use `logger.*` from `src/utils/logger.ts` (`info`, `success`, `warn`, `error`) for all user-facing output.
- Use `console.log` only in `src/cli/output.ts` for formatted plan/next-steps output.
- Never use `console.log` for debugging in committed code.

---

## Template rules (`templates/`)

### Structural constraints

- Every template variant (`js/simple`, `js/mvc`, `ts/simple`, `ts/mvc`) must remain self-contained under its directory.
- When adding a new file to one variant, consider whether it needs to exist in all four variants.
- MVC variants add `controllers/`, `services/` directories. Simple variants must not include these.

### EJS patterns

- Use `<% if (conditional) { %>...<% } %>` for conditional blocks. Avoid complex logic in templates.
- `educational` toggles only appear as inline comment blocks. They must not change runtime behavior.
- Template variables come from `templateData()`. Do not invent new variables inside `.ejs` files.
- Keep generated code readable. EJS control flow should not make the output file hard to follow.

### Database mode filtering

- `shouldIncludeTemplate()` in the generator controls which files are emitted per database mode.
- `compose.yaml.ejs` → only `postgres-docker`.
- `scripts/dbCreate.js.ejs` → only `postgres-psql`.
- `scripts/db*.js.ejs` (other than dbCreate) → both postgres modes, excluded for `memory`.
- `db/` and `src/db/` → both postgres modes, excluded for `memory`.
- When adding new database-related files, update `shouldIncludeTemplate()` accordingly.

### Generated project conventions

- Generated JS projects use CommonJS (`require`/`module.exports`). Do not introduce ESM syntax.
- Generated TS projects compile to CommonJS (`"module": "node16"` in tsconfig). Imports use ESM-style `import/export` but output is CJS.
- Generated projects target `"node": ">=20.13"` (for `node --watch` support).
- All generated projects must include a passing test suite with zero configuration needed (in-memory mode).

---

## Testing

### Test structure

- Unit tests in `test/args.test.ts` cover the argument parser.
- Generator tests in `test/generator.test.ts` cover file planning, content rendering, and dry-run.
- Integration tests in `test/integration.generated-projects.test.ts` generate full projects, run `npm install` + `npm test`, and verify exit code 0.

### Test expectations

- Every new CLI feature must have unit test coverage.
- Template changes that affect output files should be covered in `generator.test.ts`.
- Changes affecting the 12 project variant combinations (2 languages × 2 architectures × 3 database modes) must not break any existing variant.
- Tests use `os.tmpdir()` for generated output. Always clean up with `fs.remove()` in `finally` blocks.
- Integration tests have a 300s timeout — do not reduce this.

### Running tests

- `npm test` runs Vitest with `vitest run`.
- `npm run build` must succeed before publishing. The build produces `dist/cli.js` via tsup.

---

## Review focus areas

When reviewing pull requests, pay special attention to:

1. **Variant consistency** — changes to templates should work across all 12 output combinations. Check EJS conditionals for all `databaseMode`, `language`, and `architecture` values.
2. **Template data contract** — any new variable used in `.ejs` must be added to `templateData()` in the generator.
3. **Generated project correctness** — generated code must be valid, runnable, and have passing tests out of the box.
4. **No side effects in `src/core/`** — this directory must remain pure: types, defaults, labels, validation only.
5. **Clean error messages** — errors shown to the user must be clear, actionable, and not expose stack traces by default.
6. **Import extensions** — all relative imports in `src/` must use `.js` extensions (ESM requirement).
7. **Security** — templates should not embed secrets, and generated `.env.example` files should use placeholder values.
8. **Backwards compatibility** — the CLI flag interface (`--yes`, `--dry-run`, `--no-install`, `--no-git`) is the public API. Do not change existing flag behavior without a migration path.
9. **Database modes are mutually exclusive** — `memory`, `postgres-psql`, and `postgres-docker` produce completely separate output. Do not flag "inconsistencies" between content that belongs to different modes (e.g., Docker image version vs local install package version). A user only ever sees one mode's output.
10. **Platform-specific CLI commands** — Post-generation setup commands using `sudo -u postgres` are Linux-specific. The label in `output.ts` intentionally says "Linux", not "Linux/macOS", because these commands don't work on macOS Homebrew. The generated README has OS-specific instructions.
