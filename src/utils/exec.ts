import { execa } from 'execa';

import type { PackageManager } from '../core/types.js';

export async function commandExists(command: string, args: string[] = ['--version']): Promise<boolean> {
  try {
    await execa(command, args, {
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

export async function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  await execa(command, args, {
    cwd,
    stdio: 'inherit'
  });
}

function npmInstallArgs(verbose: boolean): string[] {
  const args = ['install', '--no-audit', '--no-fund'];

  if (!verbose) {
    args.push('--loglevel=error');
  }

  return args;
}

function yarnInstallArgs(verbose: boolean): string[] {
  const args = ['install'];

  if (!verbose) {
    args.push('--silent');
  }

  return args;
}

export function formatInstallCommand(packageManager: PackageManager, verbose = false): string {
  const args = packageManager === 'yarn' ? yarnInstallArgs(verbose) : npmInstallArgs(verbose);
  return `${packageManager} ${args.join(' ')}`;
}

export async function installDependencies(
  cwd: string,
  packageManager: PackageManager,
  verbose = false
): Promise<void> {
  const args = packageManager === 'yarn' ? yarnInstallArgs(verbose) : npmInstallArgs(verbose);
  await runCommand(packageManager, args, cwd);
}

export async function initGitRepo(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}
