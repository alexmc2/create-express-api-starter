# @alexmc2/create-express-api-starter

**🚧 Work in progress** - this package is under active development and not yet been published to npm.

A modern scaffolding CLI that generates production-ready Express API projects with sensible defaults. Designed to get beginners up and running quickly while teaching best practices through well-structured code and educational comments.

```bash
npx @alexmc2/create-express-api-starter my-api
```

---

## The problem

Express is intentionally unopinionated. That's a strength for experienced developers, but it means every new backend project starts with the same ritual: setting up folder structure, wiring middleware, writing error handlers, configuring a test runner, and figuring out how everything connects. Beginners lose hours to this before writing a single route.

Frontend has solved this with `create-*` tools. Backend hasn't — not well, anyway. The Express ecosystem has plenty of starter repos and outdated generators, but very few modern, interactive scaffolders that get a beginner from zero to a working, tested API in minutes.

This tool fills that gap.

## What it does

`create-express-api-starter` is an interactive CLI that generates a complete Express API project. It asks a few questions, then writes a fully working project with:

- A properly structured Express server with middleware already configured
- Health check and example resource routes with CRUD operations
- Error handling that returns consistent JSON responses
- A test suite that passes out of the box
- A README that teaches you how the generated project works
- Dev scripts that require no extra setup

The generated project is designed to be a **runway**: enough structure to get moving immediately, but simple enough to understand and extend without feeling locked in.

## How it works

This is a two-layer system:

1. **The CLI tool** (this package) — published to npm, contains the prompts, templates, and generation logic.
2. **The generated project** — a standalone Express API created inside a new folder with its own `package.json`, dependencies, scripts, and tests.

When you run `npx @alexmc2/create-express-api-starter my-api`, npm downloads the CLI temporarily and runs it. The CLI writes files into `my-api/` and optionally runs `npm install` inside that folder. The CLI doesn't "contain" Express — it generates a project that depends on Express.

## Quick start

```bash
# Interactive mode — answer a few questions
npx @alexmc2/create-express-api-starter my-api

# Accept all defaults (JavaScript, Simple architecture, In-memory DB)
npx @alexmc2/create-express-api-starter my-api --yes

# Preview what would be generated without writing anything
npx @alexmc2/create-express-api-starter my-api --dry-run
```

Then:

```bash
cd my-api
npm run dev    # Starts the dev server with watch mode
npm test       # Runs the test suite
```

Your API is live at `http://localhost:3000`. Hit `http://localhost:3000/health` to confirm.

## Options

The CLI walks you through these choices interactively, or you can skip them all with `--yes` to accept defaults.

| Option                   | Choices                                       | Default    |
| ------------------------ | --------------------------------------------- | ---------- |
| **Language**             | JavaScript, TypeScript                        | JavaScript |
| **Architecture**         | Simple (flat), MVC (layered)                  | Simple     |
| **Database**             | In-memory, Postgres (psql), Postgres (Docker) | In-memory  |
| **Educational comments** | On, Off                                       | On         |
| **Install dependencies** | Yes, No                                       | Yes        |
| **Initialise git repo**  | Yes, No                                       | Yes        |

### Flags

| Flag           | Effect                                          |
| -------------- | ----------------------------------------------- |
| `--yes`        | Accept all defaults, skip prompts               |
| `--dry-run`    | Print the generation plan without writing files |
| `--no-install` | Skip `npm install` after generation             |
| `--no-git`     | Skip `git init` after generation                |

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
│   ├── errors/
│   │   └── AppError.js     # Custom error class with status codes
│   └── middleware/
│       ├── notFound.js     # 404 handler
│       └── errorHandler.js # Centralised error handler
├── __tests__/
│   └── app.test.js         # Health check and users endpoint tests
├── .env.example
├── .gitignore
├── package.json
├── README.md               # Teaches you how the project works
└── jest.config.js
```

MVC architecture adds `controllers/`, `services/`, and `repositories/` directories with clear separation of concerns.

### Middleware (pre-configured)

Every generated project includes these middleware out of the box:

- **express.json()** — parses JSON request bodies
- **cors** — enables cross-origin requests
- **helmet** — sets security-related HTTP headers
- **morgan** — logs HTTP requests in dev format
- **dotenv** — loads environment variables from `.env`

### Error handling

Errors return a consistent JSON shape:

```json
{
  "status": 404,
  "message": "Resource not found"
}
```

In development mode, a `stack` trace is included for debugging. In production, it's omitted.

### Scripts

**JavaScript projects:**

| Script        | Command                      | Purpose                      |
| ------------- | ---------------------------- | ---------------------------- |
| `npm run dev` | `node --watch src/server.js` | Dev server with auto-restart |
| `npm start`   | `node src/server.js`         | Production start             |
| `npm test`    | `jest`                       | Run test suite               |

**TypeScript projects:**

| Script          | Command                   | Purpose                      |
| --------------- | ------------------------- | ---------------------------- |
| `npm run dev`   | `tsx watch src/server.ts` | Dev server with auto-restart |
| `npm run build` | `tsc`                     | Compile to JavaScript        |
| `npm start`     | `node dist/server.js`     | Production start (compiled)  |
| `npm test`      | `jest`                    | Run test suite               |

### Tests

Every generated project includes a working test suite using **Jest** and **Supertest**. Tests pass immediately after generation with no extra setup required (in In-memory mode).

## Database modes

### In-memory (default)

Data is stored in a plain JavaScript array. No database required — the project runs instantly. Data resets when the server restarts.

This is ideal for learning, prototyping, and understanding the project structure before adding a real database. The code is structured with a repository layer, so swapping in a real database later is straightforward.

### Postgres (psql)

For developers who already have PostgreSQL installed locally. The generated project includes:

- `pg` as a dependency with a connection pool module
- `db/schema.sql` and `db/seed.sql` for table creation and sample data
- npm scripts (`db:setup`, `db:seed`, `db:reset`) that run SQL files via `psql`

**Prerequisites:** PostgreSQL installed with `psql` available on your PATH.

```bash
# After generation
npm run db:setup    # Create tables
npm run db:seed     # Insert sample data
npm run dev         # Start the server
```

### Postgres (Docker)

For developers who have Docker but don't want to install PostgreSQL directly. The generated project includes:

- A `compose.yaml` that runs PostgreSQL in a container (port 5433 to avoid conflicts)
- Node-based setup scripts that apply schema and seed data via the `pg` library — **no `psql` required on your machine**
- A built-in retry helper that waits for the database to be ready before running setup

```bash
# After generation
npm run db:up       # Start PostgreSQL container
npm run db:setup    # Create tables (waits for DB automatically)
npm run db:seed     # Insert sample data
npm run dev         # Start the server

# When done
npm run db:down     # Stop and remove container + data
```

## Educational comments

When enabled (the default), the generated code includes short inline comments explaining _why_ things are done a certain way:

```javascript
// Parse incoming JSON request bodies so req.body is available
app.use(express.json());

// Set security headers — protects against common web vulnerabilities
app.use(helmet());
```

These are designed to be helpful without being overwhelming. Turn them off if this isn't your style, but they're there to make the generated code more approachable for beginners.

## Design decisions

### Generated projects use CommonJS

Generated projects use `require()` / `module.exports` (JavaScript) or compile TypeScript to CommonJS output. This is a deliberate choice for v0.1:

- Most Express tutorials and Stack Overflow answers use CommonJS patterns
- Jest's ESM support is still experimental — CommonJS avoids that complexity entirely
- Beginners don't need to debug ESM resolution issues on day one

### Opinionated but transparent

The tool makes choices for you (Jest, not Vitest; morgan, not pino; cors + helmet by default) because the goal is a working project, not a configuration menu. Every choice is explained in the generated README, and everything is easy to swap out.

### Runway, not airport

The scaffold gives you enough to start building immediately, but doesn't try to be a framework. No auth, no ORM, no migrations, no rate limiting, no Swagger — those are decisions you should make when you need them, not before.

## Technical details

### Requirements

- **Node.js >= 20** (>= 20.13 for generated JavaScript projects using `node --watch`)
- **npm** (ships with Node)
- **Docker** (only if using Postgres Docker mode)
- **PostgreSQL + psql** (only if using Postgres psql mode)

### This CLI is built with

- TypeScript + ESM
- [@clack/prompts](https://github.com/bombshell-elements/clack) for interactive UI
- [EJS](https://ejs.co/) for template rendering
- [Vitest](https://vitest.dev/) for the CLI's own test suite

### Generated projects are built with

- Express 4
- Jest + Supertest for testing
- `@swc/jest` for TypeScript test transforms
- `pg` for PostgreSQL connectivity (when applicable)

## Contributing

Contributions are welcome. The project uses Vitest for testing:

```bash
git clone https://github.com/alexmc2/create-express-api-starter.git
cd create-express-api-starter
npm install
npm test          # Run all tests
npm run build     # Build the CLI
npm run dev -- my-test-project  # Run from source
```

The test suite includes integration tests that generate real projects, install dependencies, and run their test suites to verify everything works end-to-end.

## Roadmap

After v0.1 is stable:

- Prisma / Drizzle ORM integration as an optional database mode
- ESLint + Prettier defaults
- Additional example resources
- Optional testing framework choice (Jest vs Vitest)
- Service-layer and layered architecture templates

## Licence

MIT
