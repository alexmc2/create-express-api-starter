import path from 'node:path';
import pc from 'picocolors';

import { architectureLabel, databaseLabel, languageLabel } from '../core/labels.js';
import type { GenerationPlan, UserSelections } from '../core/types.js';

export function printDryRunPlan(selection: UserSelections, plan: GenerationPlan): void {
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
  console.log(`1. cd ${selection.projectName}`);

  let stepNumber = 2;

  if (!selection.installDeps) {
    console.log(`${stepNumber}. npm install --no-audit --no-fund`);
    stepNumber += 1;
  }

  if (selection.databaseMode === 'postgres-psql') {
    console.log(`${stepNumber}. Copy .env.example to .env and set DATABASE_URL if needed`);
    stepNumber += 1;
    console.log(`${stepNumber}. npm run db:setup`);
    stepNumber += 1;
    console.log(`${stepNumber}. npm run db:seed`);
    stepNumber += 1;
  }

  if (selection.databaseMode === 'postgres-docker') {
    console.log(`${stepNumber}. npm run db:up`);
    stepNumber += 1;
    console.log(`${stepNumber}. npm run db:setup`);
    stepNumber += 1;
    console.log(`${stepNumber}. npm run db:seed`);
    stepNumber += 1;
  }

  console.log(`${stepNumber}. npm run dev`);
  stepNumber += 1;

  if (selection.language === 'ts') {
    console.log(`${stepNumber}. npm run build`);
    stepNumber += 1;
  }

  console.log(`${stepNumber}. npm test`);
}

export function formatTargetPath(targetDir: string): string {
  const relative = path.relative(process.cwd(), targetDir);
  return relative || '.';
}
