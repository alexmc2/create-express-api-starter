# Contributing

## Setup

```bash
npm install
npm test
npm run build
```

## Development Workflow

1. Create a branch from `main`.
2. Make your changes.
3. Run checks locally:

```bash
npm test
npm run build
npm pack --dry-run
```

4. Open a pull request with:
- A clear summary of changes.
- Testing notes.
- Any follow-up work.

## Commit Style

Conventional Commits are recommended:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `chore:` tooling/maintenance
