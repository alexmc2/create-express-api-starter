import { describe, expect, it } from 'vitest';

import { parseArgs } from '../src/cli/args.js';

describe('parseArgs', () => {
  it('handles mixed ordering for project name and flags', () => {
    const cases = [
      ['my-api', '--yes', '--dry-run'],
      ['--yes', '--dry-run', 'my-api'],
      ['--dry-run', 'my-api', '--yes']
    ];

    for (const argv of cases) {
      const parsed = parseArgs(argv);
      expect(parsed.projectName).toBe('my-api');
      expect(parsed.flags.yes).toBe(true);
      expect(parsed.flags.dryRun).toBe(true);
    }
  });

  it('collects unknown flags without crashing', () => {
    const parsed = parseArgs(['my-api', '--unknown', '-x', '--yes']);

    expect(parsed.projectName).toBe('my-api');
    expect(parsed.flags.yes).toBe(true);
    expect(parsed.unknownFlags).toEqual(['--unknown', '-x']);
  });

  it('supports -- separator and treats following values as positionals', () => {
    const parsed = parseArgs(['--yes', '--', '--dry-run', 'my-api']);

    expect(parsed.flags.yes).toBe(true);
    expect(parsed.flags.dryRun).toBe(false);
    expect(parsed.positionals).toEqual(['--dry-run', 'my-api']);
    expect(parsed.projectName).toBe('--dry-run');
  });

  it('accepts --flag=value syntax for known booleans', () => {
    const parsed = parseArgs(['my-api', '--yes=true', '--dry-run=1', '--no-git=false']);

    expect(parsed.flags.yes).toBe(true);
    expect(parsed.flags.dryRun).toBe(true);
    expect(parsed.flags.git).toBe(true);
    expect(parsed.unknownFlags).toEqual([]);
  });

  it('handles --no-install and --no-git semantics explicitly', () => {
    const parsed = parseArgs(['my-api', '--no-install', '--no-git=false']);

    expect(parsed.flags.install).toBe(false);
    expect(parsed.flags.git).toBe(true);
  });

  it('supports --verbose for full install logs', () => {
    const parsed = parseArgs(['my-api', '--verbose']);

    expect(parsed.flags.verbose).toBe(true);
    expect(parsed.unknownFlags).toEqual([]);
  });
});
