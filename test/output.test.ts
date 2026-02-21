import { afterEach, describe, expect, it, vi } from 'vitest';

import type { UserSelections } from '../src/core/types.js';
import { printNextSteps } from '../src/cli/output.js';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

const baseSelection: UserSelections = {
  projectName: 'my-api',
  language: 'js',
  moduleSystem: 'commonjs',
  jsDevWatcher: 'node-watch',
  architecture: 'simple',
  databaseMode: 'memory',
  educational: true,
  installDeps: true,
  packageManager: 'npm',
  initGit: false,
  dryRun: false,
};

function captureNextStepsLogs(
  override: Partial<UserSelections> = {},
  platform: NodeJS.Platform = process.platform,
): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' ').replace(ANSI_PATTERN, ''));
  });

  printNextSteps({
    ...baseSelection,
    ...override,
  }, platform);

  spy.mockRestore();
  return lines;
}

describe('printNextSteps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints .env copy step for memory mode', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'memory' });

    expect(lines.some((line) => line.includes('cp .env.example .env'))).toBe(
      true,
    );
    expect(lines.some((line) => line.includes('npm run db:'))).toBe(false);
  });

  it('prints psql setup guidance and database commands once', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'postgres-psql' }, 'linux');

    const envCopyLines = lines.filter((line) =>
      line.includes('cp .env.example .env'),
    );
    expect(envCopyLines).toHaveLength(1);
    expect(lines.some((line) => line.includes('Postgres Setup'))).toBe(true);
    expect(lines.some((line) => line.includes('npm run db:create'))).toBe(true);
    expect(lines.some((line) => line.includes('npm run db:setup'))).toBe(true);
    expect(lines.some((line) => line.includes('npm run db:seed'))).toBe(true);
    expect(lines.some((line) => line.includes('sudo -u postgres createuser'))).toBe(
      true,
    );
  });

  it('prints docker database commands', () => {
    const lines = captureNextStepsLogs({ databaseMode: 'postgres-docker' });

    expect(lines.some((line) => line.includes('cp .env.example .env'))).toBe(
      true,
    );
    expect(lines.some((line) => line.includes('npm run db:up'))).toBe(true);
    expect(lines.some((line) => line.includes('npm run db:setup'))).toBe(true);
    expect(lines.some((line) => line.includes('npm run db:seed'))).toBe(true);
  });

  it('prints yarn commands when yarn is selected', () => {
    const lines = captureNextStepsLogs({
      packageManager: 'yarn',
      databaseMode: 'postgres-docker',
      installDeps: false,
    });

    expect(lines.some((line) => line.includes('yarn install'))).toBe(true);
    expect(lines.some((line) => line.includes('yarn db:up'))).toBe(true);
    expect(lines.some((line) => line.includes('yarn db:setup'))).toBe(true);
    expect(lines.some((line) => line.includes('yarn db:seed'))).toBe(true);
    expect(lines.some((line) => line.includes('yarn dev'))).toBe(true);
    expect(lines.some((line) => line.includes('yarn test'))).toBe(true);
  });

  it('prints Windows-specific Postgres setup guidance without sudo', () => {
    const lines = captureNextStepsLogs(
      {
        databaseMode: 'postgres-psql',
        projectName: 'my-api-test-2',
      },
      'win32',
    );

    expect(lines.some((line) => line.includes('Windows first-time setup'))).toBe(
      true,
    );
    expect(
      lines.some((line) =>
        line.includes(
          'DATABASE_URL=postgres://postgres:<your-password>@localhost:5432/my_api_test_2_dev',
        ),
      ),
    ).toBe(true);
    expect(lines.some((line) => line.includes('sudo -u postgres'))).toBe(false);
  });
});
