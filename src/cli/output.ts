import path from 'node:path';
import pc from 'picocolors';

import {
  architectureLabel,
  databaseLabel,
  languageLabel,
} from '../core/labels.js';
import type { GenerationPlan, UserSelections } from '../core/types.js';

export function printDryRunPlan(
  selection: UserSelections,
  plan: GenerationPlan,
): void {
  console.log(pc.bold('\nDry run plan'));
  console.log(`Target: ${plan.targetDir}`);
  console.log(`Language: ${languageLabel(selection.language)}`);
  console.log(`Architecture: ${architectureLabel(selection.architecture)}`);
  console.log(`Database: ${databaseLabel(selection.databaseMode)}`);
  console.log(`Educational comments: ${selection.educational ? 'On' : 'Off'}`);
  console.log(`Install dependencies: ${selection.installDeps ? 'Yes' : 'No'}`);
  console.log(`Initialize git: ${selection.initGit ? 'Yes' : 'No'}`);
  console.log('\nFiles to generate:');

  for (const file of plan.files) {
    console.log(`  - ${file.outputRelativePath}`);
  }

  console.log(`\nTotal files: ${plan.files.length}`);
}

export function printNextSteps(selection: UserSelections): void {
  console.log(pc.bold('\nNext steps'));
  console.log(`  cd ${selection.projectName}`);

  if (!selection.installDeps) {
    console.log('  npm install');
  }

  if (selection.databaseMode === 'postgres-psql') {
    console.log('  cp .env.example .env    # then set DATABASE_URL if needed');
    console.log('  npm run db:create');
    console.log('  npm run db:setup');
    console.log('  npm run db:seed');
    console.log('');
    console.log(
      pc.dim('  New to Postgres? Check the README for setup instructions.'),
    );
    console.log('');
  }

  if (selection.databaseMode === 'postgres-docker') {
    console.log('  cp .env.example .env');
    console.log('  npm run db:up');
    console.log('  npm run db:setup');
    console.log('  npm run db:seed');
  }

  console.log('  npm run dev');

  if (selection.language === 'ts') {
    console.log('  npm run build');
  }

  console.log('  npm test');
}

export function formatTargetPath(targetDir: string): string {
  const relative = path.relative(process.cwd(), targetDir);
  return relative || '.';
}
