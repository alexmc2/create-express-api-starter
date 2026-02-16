# CLI Source Code Review Instructions

Applies to: `src/**/*.ts`

## Module boundaries

- `src/cli/` — argv parsing, prompts, output formatting, orchestration. This is the only directory that should interact with the terminal or user.
- `src/core/` — types, defaults, labels, validation. **Must have zero side effects and zero I/O.** No `fs`, no `process`, no `console` (except in `validation.ts` which uses `path` for basename checks). Flag any import of `fs`, `execa`, or logging utilities here.
- `src/generator/` — template planning, filtering, EJS rendering, file writing. Should not import from `src/cli/`.
- `src/utils/` — logging, path resolution, command execution, filesystem guards. Utility-only; should not import from `src/cli/` or `src/generator/`.

Flag any circular dependency between these directories.

## TypeScript conventions

- Strict mode is enabled. Do not accept `@ts-ignore` or `@ts-expect-error` without an explanatory comment.
- All relative imports must use `.js` extensions (ESM resolution requirement). Flag bare `.ts` extensions in import paths.
- Prefer `unknown` over `any`. If `any` is used, it must be justified.
- Union string literal types (`'js' | 'ts'`) are preferred over enums.
- All shared types belong in `src/core/types.ts`.

## Error handling

- Errors must be `Error` instances with user-facing messages. The top-level catch in `src/cli/index.ts` formats them.
- `PromptCancelledError` is the only custom error class — do not add others unless there is a clear domain reason.
- `catch` blocks must not silently swallow errors. They must rethrow, log, or handle meaningfully.

## Naming

- Functions: `camelCase`, verb-prefixed for actions (`parseArgs`, `resolveTargetDir`), adjective/noun for predicates (`isEjsTemplate`, `shouldIncludeTemplate`).
- Types/Interfaces: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for compile-time constants, `camelCase` for runtime config.
- Files: `camelCase.ts`.

## Functions

- Keep functions under ~40 lines. If longer, suggest extraction.
- Prefer `const` everywhere. `let` only when reassignment is necessary. Never `var`.
- Use `node:` protocol for Node built-ins.

## CLI output platform labels

- Post-generation setup commands in `src/cli/output.ts` that use `sudo -u postgres` are labelled "Linux" only. These commands do not work on macOS Homebrew installs (no `postgres` OS user). Do not suggest changing this label to include macOS — the generated README has full OS-specific guidance.
