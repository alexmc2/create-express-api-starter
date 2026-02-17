import {
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text
} from '@clack/prompts';
import pc from 'picocolors';

import { DEFAULT_PROJECT_NAME, DEFAULT_SELECTIONS } from '../core/defaults.js';
import type { ParsedArgs, UserSelections } from '../core/types.js';

export class PromptCancelledError extends Error {
  constructor() {
    super('Prompt cancelled by user.');
  }
}

function unwrapPrompt<T>(value: T | symbol): T {
  if (isCancel(value)) {
    throw new PromptCancelledError();
  }

  return value as T;
}

export async function collectSelections(parsedArgs: ParsedArgs): Promise<UserSelections> {
  if (parsedArgs.flags.yes || !process.stdin.isTTY) {
    return {
      projectName: parsedArgs.projectName ?? DEFAULT_PROJECT_NAME,
      language: DEFAULT_SELECTIONS.language,
      moduleSystem: DEFAULT_SELECTIONS.moduleSystem,
      jsDevWatcher: DEFAULT_SELECTIONS.jsDevWatcher,
      architecture: DEFAULT_SELECTIONS.architecture,
      databaseMode: DEFAULT_SELECTIONS.databaseMode,
      educational: DEFAULT_SELECTIONS.educational,
      installDeps: parsedArgs.flags.install,
      initGit: parsedArgs.flags.git,
      dryRun: parsedArgs.flags.dryRun
    };
  }

  intro(
    [
      pc.bold(pc.cyan('Create Express API Starter')),
      pc.dim('Scaffold an Express backend with practical defaults.')
    ].join('\n')
  );

  const projectName = parsedArgs.projectName
    ? parsedArgs.projectName
    : unwrapPrompt(
        await text({
          message: 'Project name',
          placeholder: DEFAULT_PROJECT_NAME,
          defaultValue: DEFAULT_PROJECT_NAME,
          validate(value) {
            if (!value.trim()) {
              return 'Project name is required.';
            }

            return undefined;
          }
        })
      );

  const language = unwrapPrompt(
    await select({
      message: 'Language',
      initialValue: DEFAULT_SELECTIONS.language,
      options: [
        {
          value: 'js',
          label: 'JavaScript'
        },
        {
          value: 'ts',
          label: 'TypeScript'
        }
      ]
    })
  ) as UserSelections['language'];

  const moduleSystem =
    language === 'js'
      ? (unwrapPrompt(
          await select({
            message: 'Module system',
            initialValue: DEFAULT_SELECTIONS.moduleSystem,
            options: [
              {
                value: 'commonjs',
                label: 'CommonJS'
              },
              {
                value: 'esm',
                label: 'ES Modules'
              }
            ]
          })
        ) as UserSelections['moduleSystem'])
      : 'commonjs';

  const jsDevWatcher =
    language === 'js'
      ? (unwrapPrompt(
          await select({
            message: 'Dev watcher (JavaScript)',
            initialValue: DEFAULT_SELECTIONS.jsDevWatcher,
            options: [
              {
                value: 'node-watch',
                label: 'node --watch (built-in)'
              },
              {
                value: 'nodemon',
                label: 'nodemon'
              }
            ]
          })
        ) as UserSelections['jsDevWatcher'])
      : DEFAULT_SELECTIONS.jsDevWatcher;

  const architecture = unwrapPrompt(
    await select({
      message: 'Architecture',
      initialValue: DEFAULT_SELECTIONS.architecture,
      options: [
        {
          value: 'simple',
          label: 'Simple'
        },
        {
          value: 'mvc',
          label: 'MVC'
        }
      ]
    })
  ) as UserSelections['architecture'];

  const databaseMode = unwrapPrompt(
    await select({
      message: 'Database',
      initialValue: DEFAULT_SELECTIONS.databaseMode,
      options: [
        {
          value: 'memory',
          label: 'In-memory'
        },
        {
          value: 'postgres-psql',
          label: 'Postgres (psql)'
        },
        {
          value: 'postgres-docker',
          label: 'Postgres (Docker)'
        }
      ]
    })
  ) as UserSelections['databaseMode'];

  const educational = unwrapPrompt(
    await confirm({
      message: 'Add educational comments',
      initialValue: DEFAULT_SELECTIONS.educational
    })
  );

  const installDeps = parsedArgs.provided.install
    ? parsedArgs.flags.install
    : unwrapPrompt(
        await confirm({
          message: 'Install dependencies now',
          initialValue: DEFAULT_SELECTIONS.installDeps
        })
      );

  const initGit = parsedArgs.provided.git
    ? parsedArgs.flags.git
    : unwrapPrompt(
        await confirm({
          message: 'Initialize git repository',
          initialValue: DEFAULT_SELECTIONS.initGit
        })
      );

  outro(pc.cyan('Scaffolding project files...'));

  return {
    projectName,
    language,
    moduleSystem,
    jsDevWatcher,
    architecture,
    databaseMode,
    educational,
    installDeps,
    initGit,
    dryRun: parsedArgs.flags.dryRun
  };
}
