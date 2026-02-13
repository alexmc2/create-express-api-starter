import type { ParsedArgs } from '../core/types.js';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function parseBooleanValue(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return undefined;
}

function splitFlag(token: string): { name: string; value: string | undefined } {
  const withoutPrefix = token.slice(2);
  const equalsIndex = withoutPrefix.indexOf('=');

  if (equalsIndex === -1) {
    return {
      name: withoutPrefix,
      value: undefined
    };
  }

  return {
    name: withoutPrefix.slice(0, equalsIndex),
    value: withoutPrefix.slice(equalsIndex + 1)
  };
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags = {
    yes: false,
    dryRun: false,
    install: true,
    git: true
  };

  const provided = {
    yes: false,
    dryRun: false,
    install: false,
    git: false
  };

  const unknownFlags: string[] = [];
  const positionals: string[] = [];

  let positionalOnly = false;

  for (const token of argv) {
    if (positionalOnly) {
      positionals.push(token);
      continue;
    }

    if (token === '--') {
      positionalOnly = true;
      continue;
    }

    if (!token.startsWith('-') || token === '-') {
      positionals.push(token);
      continue;
    }

    if (!token.startsWith('--')) {
      unknownFlags.push(token);
      continue;
    }

    const { name, value } = splitFlag(token);

    if (name === 'yes') {
      const parsedValue = parseBooleanValue(value);
      if (value !== undefined && parsedValue === undefined) {
        unknownFlags.push(token);
        continue;
      }
      flags.yes = parsedValue ?? true;
      provided.yes = true;
      continue;
    }

    if (name === 'dry-run') {
      const parsedValue = parseBooleanValue(value);
      if (value !== undefined && parsedValue === undefined) {
        unknownFlags.push(token);
        continue;
      }
      flags.dryRun = parsedValue ?? true;
      provided.dryRun = true;
      continue;
    }

    if (name === 'no-install') {
      const parsedValue = parseBooleanValue(value);
      if (value !== undefined && parsedValue === undefined) {
        unknownFlags.push(token);
        continue;
      }

      const noInstall = parsedValue ?? true;
      flags.install = !noInstall;
      provided.install = true;
      continue;
    }

    if (name === 'no-git') {
      const parsedValue = parseBooleanValue(value);
      if (value !== undefined && parsedValue === undefined) {
        unknownFlags.push(token);
        continue;
      }

      const noGit = parsedValue ?? true;
      flags.git = !noGit;
      provided.git = true;
      continue;
    }

    unknownFlags.push(token);
  }

  return {
    projectName: positionals[0],
    positionals,
    unknownFlags,
    flags,
    provided
  };
}
