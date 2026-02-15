# Test Review Instructions

Applies to: `test/**/*.test.ts`

## Test structure

- `test/args.test.ts` — unit tests for the CLI argument parser (`parseArgs`).
- `test/generator.test.ts` — generator tests for file planning, content rendering, and dry-run behavior.
- `test/integration.generated-projects.test.ts` — end-to-end tests that generate full projects, run `npm install` + `npm test`, and verify exit code 0.

## Coverage expectations

- Every new CLI flag or argument must have corresponding tests in `args.test.ts`.
- Template changes that alter output files or content should be covered in `generator.test.ts`.
- Changes affecting any of the 12 variant combinations (2 languages × 2 architectures × 3 database modes) must not break existing tests.

## Test conventions

- Tests use Vitest (`describe`, `it`, `expect`).
- Temporary directories use `os.tmpdir()` via `fs.mkdtemp()`.
- **Always** clean up generated files in a `finally` block using `fs.remove()`. Flag any test that creates temp files without cleanup.
- Integration tests use `300000` ms (300s) timeout. Do not reduce this value.
- Integration tests are marked `describe.sequential` to avoid parallel filesystem conflicts.

## Assertions

- Prefer specific assertions (`toBe`, `toContain`, `toEqual`) over loose ones (`toBeTruthy`).
- When checking generated file content, verify specific strings rather than just existence.
- When checking file existence, use `fs.pathExists()` from fs-extra.

## What to flag

- Tests that depend on network access without justification (integration tests legitimately need `npm install`).
- Missing `finally` cleanup blocks for temp directories.
- Snapshot tests — this project does not use them; prefer explicit assertions.
- Tests that modify the source project's filesystem instead of using temp directories.
