import pc from 'picocolors';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parseArgs } from './args.js';
import { printDryRunPlan, printNextSteps } from './output.js';
import { collectSelections, PromptCancelledError } from './prompts.js';
import { validateProjectName } from '../core/validation.js';
import { generateProject, planProject } from '../generator/index.js';
import { commandExists, initGitRepo, installDependencies } from '../utils/exec.js';
import { assertSafeTargetDir } from '../utils/files.js';
import { logger } from '../utils/logger.js';
import { resolveTargetDir } from '../utils/paths.js';

async function ensurePsqlAvailable(): Promise<void> {
  const hasPsql = await commandExists('psql', ['--version']);

  if (!hasPsql) {
    throw new Error(
      [
        'Postgres (psql) mode requires the `psql` client tool, but it was not found.',
        'Install Postgres client tools and make sure `psql --version` works, or rerun and choose Postgres (Docker).'
      ].join(' ')
    );
  }
}

function registerSigintHandler(): void {
  process.on('SIGINT', () => {
    logger.warn('Cancelled by user.');
    process.exit(1);
  });
}

async function runCli(argv: string[]): Promise<void> {
  const parsedArgs = parseArgs(argv);

  for (const unknownFlag of parsedArgs.unknownFlags) {
    logger.warn(`Unknown flag "${unknownFlag}" was ignored.`);
  }

  const selections = await collectSelections(parsedArgs);

  const projectNameError = validateProjectName(selections.projectName);

  if (projectNameError) {
    throw new Error(projectNameError);
  }

  const targetDir = resolveTargetDir(process.cwd(), selections.projectName);

  await assertSafeTargetDir(targetDir);

  if (selections.databaseMode === 'postgres-psql') {
    await ensurePsqlAvailable();
  }

  const templateConfig = {
    projectName: selections.projectName,
    language: selections.language,
    moduleSystem: selections.moduleSystem,
    architecture: selections.architecture,
    educational: selections.educational,
    databaseMode: selections.databaseMode
  };

  const plan = await planProject(templateConfig, targetDir);

  if (selections.dryRun) {
    printDryRunPlan(selections, plan);
    return;
  }

  await generateProject({
    config: templateConfig,
    targetDir
  });

  logger.success(`Project files generated at ${targetDir}.`);

  if (selections.installDeps) {
    const installCommand = parsedArgs.flags.verbose
      ? 'npm install --no-audit --no-fund'
      : 'npm install --no-audit --no-fund --loglevel=error';
    logger.info(`Installing dependencies (${installCommand})...`);
    await installDependencies(targetDir, parsedArgs.flags.verbose);
    logger.success('Dependencies installed.');
  } else {
    logger.info('Skipped dependency installation.');
  }

  if (selections.initGit) {
    logger.info('Initializing git repository...');
    await initGitRepo(targetDir);
    logger.success('Git repository initialized.');
  } else {
    logger.info('Skipped git initialization.');
  }

  logger.success('Scaffolding complete.');
  printNextSteps(selections);
}

function isCliEntrypoint(): boolean {
  if (typeof process.argv[1] !== 'string') {
    return false;
  }

  try {
    const argvPath = fs.realpathSync(process.argv[1]);
    const modulePath = fs.realpathSync(fileURLToPath(import.meta.url));
    return argvPath === modulePath;
  } catch {
    return pathToFileURL(process.argv[1]).href === import.meta.url;
  }
}

const isEntrypoint = isCliEntrypoint();

if (isEntrypoint) {
  registerSigintHandler();

  runCli(process.argv.slice(2)).catch((error: unknown) => {
    if (error instanceof PromptCancelledError) {
      logger.warn('Cancelled by user.');
      process.exit(1);
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    logger.error(message);
    if (error instanceof Error && error.stack) {
      console.error(pc.gray(error.stack));
    }
    process.exit(1);
  });
}

export { runCli };
