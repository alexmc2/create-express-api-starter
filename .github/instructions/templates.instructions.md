# Template Review Instructions

Applies to: `templates/**/*.ejs`

## Generated code correctness

- Generated JavaScript files must use CommonJS (`require` / `module.exports`). Flag any `import`/`export` ESM syntax in `templates/js/**`.
- Generated TypeScript files use ESM-style `import`/`export` but compile to CommonJS via `"module": "node16"` in tsconfig.
- Generated projects target `"node": ">=20.13"`. Do not use APIs unavailable in Node 20.

## Variant consistency

There are 4 template variants: `js/simple`, `js/mvc`, `ts/simple`, `ts/mvc`. When reviewing:

- If a file is added or modified in one variant, check whether the same change is needed in the other variants.
- MVC variants include `src/controllers/` and `src/services/`. Simple variants must not.
- All variants share: `.env.example`, `.gitignore`, `README.md`, `compose.yaml`, `db/schema.sql`, `db/seed.sql`, `jest.config.js`, `package.json`, `scripts/dbReset.js`, `scripts/dbSeed.js`, `scripts/dbSetup.js`.

## EJS patterns

- Use `<% if (conditional) { %>...<% } %>` for conditional blocks.
- Avoid complex logic (loops, nested conditionals, computed values) inside templates. Logic belongs in `templateData()` in the generator.
- All template variables must come from `templateData()` in `src/generator/index.ts`. Flag any variable used in a template that is not defined there.
- Current valid template variables: `projectName`, `language`, `architecture`, `educational`, `databaseMode`, `isTypeScript`, `isPostgres`, `isDocker`, `isPsql`, `packageName`, `databaseName`, `educationalLabel`, `languageLabel`, `architectureLabel`, `databaseLabel`, `databaseUrl`, `osUsername`.

## Educational comments

- `educational` conditionals must only toggle inline comments (e.g., `// Parse JSON...`).
- Educational blocks must never change runtime behavior — no conditional logic, no different code paths, only comments.

## Database mode filtering

File inclusion is controlled by `shouldIncludeTemplate()` in the generator, not by EJS conditionals at the file level. Within included files, use EJS conditionals for content variation:

- `isPostgres` — true for both `postgres-psql` and `postgres-docker`.
- `isPsql` — true only for `postgres-psql`.
- `isDocker` — true only for `postgres-docker`.

## Security

- `.env.example` files must use placeholder values, never real credentials.
- Database URLs use convention-based defaults (`postgres://postgres:postgres@localhost:5433/...` for Docker, `postgres://<osUsername>:postgres@localhost:5432/...` for psql).
- Do not hardcode secrets or API keys in any template.

## Readability

- Generated files should read naturally with EJS control flow removed. If a template's EJS makes the output hard to follow, suggest restructuring.
- Preserve consistent formatting in generated output (indentation, blank lines).
