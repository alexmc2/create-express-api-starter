import { execa } from 'execa';

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

export async function installDependencies(cwd: string, verbose = false): Promise<void> {
  const args = ['install', '--no-audit', '--no-fund'];

  if (!verbose) {
    args.push('--loglevel=error');
  }

  await runCommand('npm', args, cwd);
}

export async function initGitRepo(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}
