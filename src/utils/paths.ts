import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

export function resolveTargetDir(baseDir: string, projectName: string): string {
  return path.resolve(baseDir, projectName);
}

export function resolveTemplatesDir(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));

  const candidates = [
    path.resolve(moduleDir, '../templates'),
    path.resolve(moduleDir, '../../templates'),
    path.resolve(process.cwd(), 'templates')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to locate templates directory.');
}
