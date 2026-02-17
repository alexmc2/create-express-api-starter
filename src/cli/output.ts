import path from 'node:path';
import pc from 'picocolors';

import {
  architectureLabel,
  databaseLabel,
  languageLabel,
  moduleSystemLabel,
} from '../core/labels.js';
import type { GenerationPlan, UserSelections } from '../core/types.js';
import {
  formatCommandLines,
  formatKeyValueLines,
  printCard,
} from '../utils/terminalUi.js';

function buildNextStepCommands(selection: UserSelections): string[] {
  const commands = [`cd ${selection.projectName}`];

  if (!selection.installDeps) {
    commands.push('npm install');
  }

  commands.push('cp .env.example .env');

  if (selection.databaseMode === 'postgres-psql') {
    commands.push('npm run db:create');
    commands.push('npm run db:setup');
    commands.push('npm run db:seed');
  }

  if (selection.databaseMode === 'postgres-docker') {
    commands.push('npm run db:up');
    commands.push('npm run db:setup');
    commands.push('npm run db:seed');
  }

  commands.push('npm run dev');

  if (selection.language === 'ts') {
    commands.push('npm run build');
  }

  commands.push('npm test');

  return commands;
}

export function printDryRunPlan(
  selection: UserSelections,
  plan: GenerationPlan,
): void {
  const languageValue =
    selection.language === 'js'
      ? `${languageLabel(selection.language)} (${moduleSystemLabel(selection.moduleSystem)})`
      : languageLabel(selection.language);

  const summaryLines = formatKeyValueLines([
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
      key: 'Init git',
      value: selection.initGit ? 'Yes' : 'No',
      tone: selection.initGit ? 'success' : 'warn',
    },
  ]);

  const fileLines = plan.files.map((file) => `${pc.dim('-')} ${file.outputRelativePath}`);

  console.log('');
  printCard('Dry Run: Configuration', summaryLines);
  console.log('');
  printCard(`Dry Run: Files (${plan.files.length})`, fileLines);
}

export function printNextSteps(selection: UserSelections): void {
  const stackParts = [
    selection.language === 'js'
      ? `${languageLabel(selection.language)} (${moduleSystemLabel(selection.moduleSystem)})`
      : languageLabel(selection.language),
    architectureLabel(selection.architecture),
    databaseLabel(selection.databaseMode),
  ];

  const summaryLines = formatKeyValueLines([
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
  ]);

  const nextStepCommands = buildNextStepCommands(selection);

  console.log('');
  printCard('Project Ready', summaryLines);
  console.log('');
  printCard('Next Steps', formatCommandLines(nextStepCommands));

  if (selection.databaseMode === 'postgres-psql') {
    const setupLines = [
      pc.yellow('Linux first-time setup (run once if needed):'),
      pc.dim('# Create a Postgres role matching your OS user'),
      ...formatCommandLines([
        'sudo -u postgres createuser --createdb "$USER"',
        `sudo -u postgres psql -c "ALTER USER \\"$USER\\" WITH PASSWORD 'postgres';"`,
      ]),
    ];

    console.log('');
    printCard('Postgres Setup', setupLines);
  }
}

export function formatTargetPath(targetDir: string): string {
  const relative = path.relative(process.cwd(), targetDir);
  return relative || '.';
}
