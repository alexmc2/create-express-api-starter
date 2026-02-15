# Generator Review Instructions

Applies to: `src/generator/**/*.ts`

## Core responsibilities

The generator (`src/generator/index.ts`) is the bridge between CLI selections and file output. It:

1. Resolves the template root directory (`templates/{language}/{architecture}`).
2. Recursively lists all template files (sorted lexicographically).
3. Filters files based on database mode via `shouldIncludeTemplate()`.
4. Builds the EJS render data via `templateData()`.
5. Renders `.ejs` templates and writes output files with the `.ejs` suffix stripped.

## Template data contract

`templateData()` builds the complete render context. When reviewing:

- Any new variable used in a `.ejs` template **must** be added to `templateData()`.
- The return type is `Record<string, unknown>` — verify that all values are correctly typed and computed.
- Current computed properties: `isTypeScript`, `isPostgres`, `isDocker`, `isPsql`, `packageName`, `databaseName`, `educationalLabel`, `languageLabel`, `architectureLabel`, `databaseLabel`, `databaseUrl`, `osUsername`.

## File inclusion rules

`shouldIncludeTemplate()` determines which template files are emitted per database mode:

| File pattern                  | `memory`     | `postgres-psql` | `postgres-docker` |
| ----------------------------- | ------------ | --------------- | ----------------- |
| `compose.yaml.ejs`            | excluded     | excluded        | **included**      |
| `scripts/dbCreate.js.ejs`     | excluded     | **included**    | excluded          |
| `scripts/db*.js.ejs` (others) | excluded     | **included**    | **included**      |
| `db/**`                       | excluded     | **included**    | **included**      |
| `src/db/**`                   | excluded     | **included**    | **included**      |
| Everything else               | **included** | **included**    | **included**      |

When reviewing changes to file inclusion logic, verify all three database modes are handled correctly.

## Naming helpers

- `toPackageName()` converts project names to valid npm package names (lowercase, special chars to hyphens).
- `toDatabaseName()` converts project names to valid Postgres database names (lowercase, special chars to underscores, `_dev` suffix).

Verify these handle edge cases: empty strings, leading/trailing special characters, all-special-character names.

## Path handling

- Template paths are normalized to POSIX (`/`) internally via `toPosixPath()`.
- Output paths are converted back to OS-native separators via `fromPosixPath()`.
- Flag any raw `path.join()` on template-relative paths that doesn't go through normalization.
