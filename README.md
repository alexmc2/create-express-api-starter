# @alexmc2/create-express-api-starter

An interactive CLI that scaffolds beginner-friendly Express API projects. Answer a few questions and get a fully working, tested API with sensible defaults - ready to run in minutes.

![create-express-api-starter CLI output](https://res.cloudinary.com/drbz4rq7y/image/upload/v1771349250/projects/readme_hn5fvu.png)

> Works on Linux, macOS, and Windows. The screenshot above shows Linux-specific Postgres setup, but the generated README includes instructions for all platforms.

```bash
npx @alexmc2/create-express-api-starter my-api
```

---

## Why this exists

Express is unopinionated by design. That's great, but it means every new project starts with the same setup: folder structure, middleware wiring, error handlers, test runner, linting. This tool does all of that for you so you can skip straight to writing routes.

The generated project is simple enough to understand and modify. It's not a framework - it's a starting point that gets out of your way.

## How it works

This is a two-part system:

1. **The CLI** (this package) - asks what you want, then generates files from templates.
2. **The generated project** - a standalone Express API in its own folder with its own dependencies, scripts, and tests. The CLI exits after creating it.

When you run `npx @alexmc2/create-express-api-starter my-api`, npm downloads the CLI, generates the project into `my-api/`, optionally runs `npm install`, and exits. The generated project has no dependency on this tool.

## Quick start

```bash
# Interactive - answer a few questions
npx @alexmc2/create-express-api-starter my-api

# Skip prompts and accept all defaults
npx @alexmc2/create-express-api-starter my-api --yes

# Preview what would be generated without writing anything
npx @alexmc2/create-express-api-starter my-api --dry-run
```

Then:

```bash
cd my-api
cp .env.example .env
npm run dev    # Start the dev server
npm test       # Run the test suite
npm run lint   # Run ESLint
```

Your API is live at `http://localhost:3000`. Hit `http://localhost:3000/health` to confirm.

## Options

The CLI walks you through these choices interactively. Use `--yes` to skip prompts and accept all defaults.

| Option                      | Choices                                       | Default        |
| --------------------------- | --------------------------------------------- | -------------- |
| **Language**                | JavaScript, TypeScript                        | JavaScript     |
| **Module system** (JS only) | CommonJS, ES Modules                          | CommonJS       |
| **Dev watcher** (JS only)   | `node --watch`, `nodemon`                     | `node --watch` |
| **Architecture**            | Simple (flat), MVC (layered)                  | Simple         |
| **Database**                | In-memory, Postgres (psql), Postgres (Docker) | In-memory      |
| **Educational comments**    | On, Off                                       | On             |
| **Install dependencies**    | Yes, No                                       | Yes            |
| **Initialise git repo**     | Yes, No                                       | Yes            |

### CLI flags

| Flag           | Effect                                                      |
| -------------- | ----------------------------------------------------------- |
| `--yes`        | Accept all defaults, skip prompts                           |
| `--dry-run`    | Show the generation plan without writing files              |
| `--no-install` | Skip `npm install` after generation                         |
| `--no-git`     | Skip `git init` after generation                            |
| `--verbose`    | Show full `npm install` output instead of the quiet default |

## What gets generated

### Project structure (Simple architecture, JavaScript)

```
my-api/
├── src/
│   ├── app.js              # Express app: middleware, routes, error handling
│   ├── server.js           # Starts the server on PORT
│   ├── routes/
│   │   ├── health.js       # GET /health
│   │   └── users.js        # GET & POST /api/users
│   ├── utils/
│   │   └── getPort.js      # PORT parsing helper
│   ├── errors/
│   │   └── AppError.js     # Custom error class
│   └── middleware/
│       ├── notFound.js     # 404 handler
│       └── errorHandler.js # Centralised error handler
├── __tests__/
│   └── app.test.js         # Health check and users endpoint tests
├── .env.example
├── .gitignore
├── .eslintrc.cjs
├── package.json
├── README.md
└── jest.config.js
```

MVC architecture adds `controllers/`, `services/`, and `repositories/` directories with clear separation of concerns.

Postgres modes additionally include `db/schema.sql`, `db/seed.sql`, `src/db/` (connection pool), and setup scripts in `scripts/`. Docker mode adds a `compose.yaml`.

### Middleware

Every generated project comes with these pre-configured:

- **express.json()** - parses JSON request bodies
- **cors** - enables cross-origin requests
- **helmet** - sets security-related HTTP headers
- **morgan** - logs HTTP requests in dev format
- **dotenv** - loads environment variables from `.env`

### Error handling

Errors return a consistent JSON shape:

```json
{
  "status": 404,
  "message": "Resource not found"
}
```

In development, a `stack` trace is included for debugging. In production, it's omitted.

In PostgreSQL mode, duplicate values for unique fields (like `email`) return `409 Conflict` with a clear message instead of a generic `500`.

### Scripts

**JavaScript projects:**

| Script         | Command                                                         | Purpose                      |
| -------------- | --------------------------------------------------------------- | ---------------------------- |
| `npm run dev`  | `node --watch src/server.js` or `nodemon src/server.js`         | Dev server with auto-restart |
| `npm start`    | `node src/server.js`                                            | Production start             |
| `npm test`     | `jest` (CJS) or `node --experimental-vm-modules ... jest` (ESM) | Run test suite               |
| `npm run lint` | `eslint .`                                                      | Lint source files            |

Choosing `nodemon` adds it to `devDependencies` automatically.

**TypeScript projects:**

| Script          | Command                   | Purpose                      |
| --------------- | ------------------------- | ---------------------------- |
| `npm run dev`   | `tsx watch src/server.ts` | Dev server with auto-restart |
| `npm run build` | `tsc`                     | Compile to JavaScript        |
| `npm start`     | `node dist/server.js`     | Production start (compiled)  |
| `npm test`      | `jest`                    | Run test suite               |
| `npm run lint`  | `eslint . --ext .ts`      | Lint source files            |

**Postgres modes also include:**

| Script              | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `npm run db:create` | Create the database (psql mode only)              |
| `npm run db:setup`  | Apply `db/schema.sql`                             |
| `npm run db:seed`   | Insert sample data from `db/seed.sql`             |
| `npm run db:reset`  | Drop and recreate tables, then re-seed            |
| `npm run db:up`     | Start the PostgreSQL container (Docker mode only) |
| `npm run db:down`   | Stop and remove the container (Docker mode only)  |

### Tests

Every generated project includes a working test suite using **Jest** and **Supertest**. Tests pass immediately after generation - no extra setup needed (in in-memory mode).

## Database modes

### In-memory (default)

Data lives in a plain JavaScript array. No database setup required. Data resets when the server restarts.

Good for learning the project structure and getting something running fast. The code uses a repository pattern, so switching to a real database later is straightforward.

### Postgres (psql)

For developers who already have PostgreSQL installed locally. The generated project includes:

- `pg` as a dependency with a connection pool
- `db/schema.sql` and `db/seed.sql` for table creation and sample data
- Node scripts for database management (`db:create`, `db:setup`, `db:seed`, `db:reset`) using the `pg` library
- A project-specific database name derived from your project name (e.g. `my-api` → `my_api_dev`)
- `DATABASE_URL` pre-configured with your OS username

**Requires:** PostgreSQL installed and running locally.

```bash
# After generation
npm run db:create   # Create the database
npm run db:setup    # Create tables
npm run db:seed     # Insert sample data
npm run dev         # Start the server
```

The generated README includes OS-specific PostgreSQL installation and role setup instructions.

### Postgres (Docker)

For developers who have Docker but don't want to install PostgreSQL locally. The generated project includes:

- A `compose.yaml` that runs PostgreSQL in a container (port 5433 to avoid conflicts with local installs)
- Node-based setup scripts using the `pg` library - no `psql` CLI needed on your machine
- A retry helper that waits for the database container to be ready before running setup

```bash
# After generation
npm run db:up       # Start PostgreSQL container
npm run db:setup    # Create tables (retries until DB is ready)
npm run db:seed     # Insert sample data
npm run dev         # Start the server

# When done
npm run db:down     # Stop and remove container + data
```

## Educational comments

Enabled by default. The generated code includes short inline comments explaining _why_ things are done a certain way:

```javascript
// Parse JSON request bodies so route handlers can read data from req.body.
// Without this middleware, req.body is undefined for JSON requests.
app.use(express.json());

// Set common HTTP security headers.
// Helmet applies safe defaults that reduce exposure to common web attacks.
app.use(helmet());
```

These comments cover middleware, routing, error handling, database scripts, and architecture patterns. They teach without getting in the way. Turn them off during generation if you prefer clean code.

## Design decisions

**Opinionated defaults, easy to change.** The tool picks Jest, morgan, cors, helmet, and ESLint for you so the project works immediately. The generated README explains each choice, and everything is easy to swap out.

**Module system is a choice (JS only).** CommonJS is the default because most Express tutorials use it. ES Modules are available if you prefer modern `import`/`export` syntax. TypeScript projects always use ESM-style imports that compile to CommonJS.

**Dev watcher is a choice (JS only).** `node --watch` is built-in and needs no extra dependency (requires Node >= 20.13). `nodemon` is the alternative for developers who already use it. TypeScript projects always use `tsx watch`.

**No extras you didn't ask for.** No auth, no ORM, no migrations, no rate limiting, no OpenAPI. Those are decisions worth making when you actually need them.

## Requirements

- **Node.js >= 20** (>= 20.13 if choosing `node --watch` as the JavaScript dev watcher)
- **npm** (ships with Node)
- **Docker** (only for Postgres Docker mode)
- **PostgreSQL** (only for Postgres psql mode)

## Built with

**The CLI itself:**

- TypeScript + ESM, built with [tsup](https://tsup.egoist.dev/)
- [@clack/prompts](https://github.com/bombshell-elements/clack) for interactive UI
- [EJS](https://ejs.co/) for template rendering
- [Vitest](https://vitest.dev/) for the CLI's own tests

**Generated projects use:**

- Express 4
- Jest + Supertest for testing
- ESLint for linting
- `@swc/jest` for TypeScript test transforms
- `pg` for PostgreSQL (when applicable)

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```bash
git clone https://github.com/alexmc2/create-express-api-starter.git
cd create-express-api-starter
npm install
npm test          # Run all tests (unit + integration)
npm run test:unit # Run unit tests only
npm run build     # Build the CLI
npm run dev -- my-test-project  # Run from source
```

The test suite includes integration tests that generate real projects across all variant combinations, install dependencies, run their test suites, and run their linters.

## Licence

MIT
