import type { UserSelections } from './types.js';

export const DEFAULT_PROJECT_NAME = 'my-api';

export const DEFAULT_SELECTIONS: Omit<UserSelections, 'projectName' | 'dryRun'> = {
  language: 'js',
  moduleSystem: 'commonjs',
  architecture: 'simple',
  databaseMode: 'memory',
  educational: true,
  installDeps: true,
  initGit: true
};
