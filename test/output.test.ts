import { afterEach, describe, expect, it, vi } from 'vitest';

import type { UserSelections } from '../src/core/types.js';
import { printNextSteps } from '../src/cli/output.js';

const baseSelection: UserSelections = {
  projectName: 'my-api',
  language: 'js',
  architecture: 'simple',
  databaseMode: 'memory',
  educational: true,
  installDeps: true,
  initGit: false,
  dryRun: false,
};

function captureNextStepsLogs(
  override: Partial<UserSelections> = {},
): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });

  printNextSteps({
    ...baseSelection,
    ...override,
  });

  spy.mockRestore();
  return lines;
}

describe('printNextSteps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints .env copy step for memory mode', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'memory' });

    expect(lines).toContain('  cp .env.example .env');
    expect(lines.some((line) => line.includes('npm run db:'))).toBe(false);
  });

  it('prints psql setup guidance and database commands once', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'postgres-psql' });

    const envCopyLines = lines.filter((line) => line === '  cp .env.example .env');
    expect(envCopyLines).toHaveLength(1);
    expect(
      lines.some((line) => line.includes('First-time Postgres setup')),
    ).toBe(true);
    expect(lines).toContain('  npm run db:create');
    expect(lines).toContain('  npm run db:setup');
    expect(lines).toContain('  npm run db:seed');
  });

  it('prints docker database commands', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'postgres-docker' });

    expect(lines).toContain('  cp .env.example .env');
    expect(lines).toContain('  npm run db:up');
    expect(lines).toContain('  npm run db:setup');
    expect(lines).toContain('  npm run db:seed');
  });
});
