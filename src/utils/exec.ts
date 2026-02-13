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

export async function installDependencies(cwd: string): Promise<void> {
  await runCommand('npm', ['install', '--no-audit', '--no-fund'], cwd);
}

export async function initGitRepo(cwd: string): Promise<void> {
  await runCommand('git', ['init'], cwd);
}
