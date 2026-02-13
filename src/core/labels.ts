import type { Architecture, DatabaseMode, Language } from './types.js';

export function languageLabel(language: Language): string {
  return language === 'ts' ? 'TypeScript' : 'JavaScript';
}

export function architectureLabel(architecture: Architecture): string {
  return architecture === 'mvc' ? 'MVC' : 'Simple';
}

export function databaseLabel(databaseMode: DatabaseMode): string {
  if (databaseMode === 'postgres-psql') {
    return 'Postgres (psql)';
  }

  if (databaseMode === 'postgres-docker') {
    return 'Postgres (Docker)';
  }

  return 'In-memory';
}
