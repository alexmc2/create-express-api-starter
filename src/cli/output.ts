import path from 'node:path';
import pc from 'picocolors';

import {
  architectureLabel,
  databaseLabel,
  jsDevWatcherLabel,
  languageLabel,
  moduleSystemLabel,
  packageManagerLabel,
} from '../core/labels.js';
import { toDatabaseName } from '../core/naming.js';
import type { GenerationPlan, UserSelections } from '../core/types.js';
import {
  formatCommandLines,
  formatKeyValueLines,
  printCard,
} from '../utils/terminalUi.js';

function installCommand(selection: UserSelections): string {
  return `${selection.packageManager} install`;
}

function scriptCommand(selection: UserSelections, script: string): string {
  if (selection.packageManager === 'yarn') {
    return `yarn ${script}`;
  }

  if (script === 'test') {
    return 'npm test';
  }

  return `npm run ${script}`;
}

function buildNextStepCommands(selection: UserSelections): string[] {
  const commands = [`cd ${selection.projectName}`];

  if (!selection.installDeps) {
    commands.push(installCommand(selection));
  }

  commands.push('cp .env.example .env');

  if (selection.databaseMode === 'postgres-psql') {
    commands.push(scriptCommand(selection, 'db:create'));
    commands.push(scriptCommand(selection, 'db:setup'));
    commands.push(scriptCommand(selection, 'db:seed'));
  }

  if (selection.databaseMode === 'postgres-docker') {
    commands.push(scriptCommand(selection, 'db:up'));
    commands.push(scriptCommand(selection, 'db:setup'));
    commands.push(scriptCommand(selection, 'db:seed'));
  }

  commands.push(scriptCommand(selection, 'dev'));

  if (selection.language === 'ts') {
    commands.push(scriptCommand(selection, 'build'));
  }

  commands.push(scriptCommand(selection, 'test'));

  return commands;
}

function buildPsqlSetupLines(
  selection: UserSelections,
  platform: NodeJS.Platform,
): string[] {
  const databaseName = toDatabaseName(selection.projectName);

  if (platform === 'win32') {
    return [
      pc.yellow('Windows first-time setup (run once if needed):'),
      pc.dim('# Edit .env and use the role/password from the PostgreSQL installer'),
      ...formatCommandLines([
        `DATABASE_URL=postgres://postgres:<your-password>@localhost:5432/${databaseName}`,
      ]),
      pc.dim('# Then run the db scripts below:'),
      ...formatCommandLines([scriptCommand(selection, 'db:create')]),
    ];
  }

  if (platform === 'darwin') {
    return [
      pc.yellow('macOS first-time setup (run once if needed):'),
      pc.dim('# Homebrew installs often already create a role for your OS user'),
      pc.dim('# Run these only if you get a role/auth error'),
      ...formatCommandLines([
        'createuser --createdb "$USER"',
        `psql -d postgres -c "ALTER USER \\"$USER\\" WITH PASSWORD 'postgres';"`,
      ]),
    ];
  }

  return [
    pc.yellow('Linux first-time setup (run once if needed):'),
    pc.dim('# Create a Postgres role matching your OS user'),
    ...formatCommandLines([
      'sudo -u postgres createuser --createdb "$USER"',
      `sudo -u postgres psql -c "ALTER USER \\"$USER\\" WITH PASSWORD 'postgres';"`,
    ]),
  ];
}

export function printDryRunPlan(
  selection: UserSelections,
  plan: GenerationPlan,
): void {
  const languageValue =
    selection.language === 'js'
      ? `${languageLabel(selection.language)} (${moduleSystemLabel(selection.moduleSystem)})`
      : languageLabel(selection.language);

  const summaryEntries: Parameters<typeof formatKeyValueLines>[0] = [
    {
      key: 'Target',
      value: formatTargetPath(plan.targetDir),
      tone: 'accent',
    },
    {
      key: 'Language',
      value: languageValue,
      tone: 'accent',
    },
    {
      key: 'Architecture',
      value: architectureLabel(selection.architecture),
      tone: 'accent',
    },
    {
      key: 'Database',
      value: databaseLabel(selection.databaseMode),
      tone: 'accent',
    },
  ];

  if (selection.language === 'js') {
    summaryEntries.push({
      key: 'Dev watcher',
      value: jsDevWatcherLabel(selection.jsDevWatcher),
      tone: 'accent',
    });
  }

  summaryEntries.push(
    {
      key: 'Educational',
      value: selection.educational ? 'On' : 'Off',
      tone: selection.educational ? 'success' : 'muted',
    },
    {
      key: 'Install deps',
      value: selection.installDeps ? 'Yes' : 'No',
      tone: selection.installDeps ? 'success' : 'warn',
    },
    {
      key: 'Package manager',
      value: packageManagerLabel(selection.packageManager),
      tone: 'accent',
    },
    {
      key: 'Init git',
      value: selection.initGit ? 'Yes' : 'No',
      tone: selection.initGit ? 'success' : 'warn',
    },
  );

  const summaryLines = formatKeyValueLines(summaryEntries);

  const fileLines = plan.files.map((file) => `${pc.dim('-')} ${file.outputRelativePath}`);

  console.log('');
  printCard('Dry Run: Configuration', summaryLines);
  console.log('');
  printCard(`Dry Run: Files (${plan.files.length})`, fileLines);
}

export function printNextSteps(
  selection: UserSelections,
  platform: NodeJS.Platform = process.platform,
): void {
  const stackParts = [
    selection.language === 'js'
      ? `${languageLabel(selection.language)} (${moduleSystemLabel(selection.moduleSystem)})`
      : languageLabel(selection.language),
    architectureLabel(selection.architecture),
    databaseLabel(selection.databaseMode),
  ];

  const summaryEntries: Parameters<typeof formatKeyValueLines>[0] = [
    {
      key: 'Project',
      value: selection.projectName,
      tone: 'accent',
    },
    {
      key: 'Stack',
      value: stackParts.join(' | '),
      tone: 'accent',
    },
    {
      key: 'Educational',
      value: selection.educational ? 'On' : 'Off',
      tone: selection.educational ? 'success' : 'muted',
    },
    {
      key: 'Package manager',
      value: packageManagerLabel(selection.packageManager),
      tone: 'accent',
    },
  ];

  if (selection.language === 'js') {
    summaryEntries.push({
      key: 'Dev watcher',
      value: jsDevWatcherLabel(selection.jsDevWatcher),
      tone: 'accent',
    });
  }

  const summaryLines = formatKeyValueLines(summaryEntries);

  const nextStepCommands = buildNextStepCommands(selection);

  console.log('');
  printCard('Project Ready', summaryLines);
  console.log('');
  printCard('Next Steps', formatCommandLines(nextStepCommands));

  if (selection.databaseMode === 'postgres-psql') {
    const setupLines = buildPsqlSetupLines(selection, platform);

    console.log('');
    printCard('Postgres Setup', setupLines);
  }
}

export function formatTargetPath(targetDir: string): string {
  const relative = path.relative(process.cwd(), targetDir);
  return relative || '.';
}
