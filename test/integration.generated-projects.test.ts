import os from 'node:os';
import path from 'node:path';

import { execa } from 'execa';
import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';

import { generateProject } from '../src/generator/index.js';

describe.sequential('generated project integration', () => {
  it(
    'generates JS in-memory project and passes npm test',
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-express-api-js-'));
      const targetDir = path.join(root, 'js-api');

      try {
        await generateProject({
          config: {
            projectName: 'js-api',
            language: 'js',
            moduleSystem: 'commonjs',
            jsDevWatcher: 'node-watch',
            architecture: 'simple',
            educational: true,
            databaseMode: 'memory'
          },
          targetDir
        });

        await execa('npm', ['install', '--no-audit', '--no-fund'], { cwd: targetDir });
        const testRun = await execa('npm', ['test'], { cwd: targetDir });

        expect(testRun.exitCode).toBe(0);
      } finally {
        await fs.remove(root);
      }
    },
    300000
  );

  it(
    'generates TS in-memory project and passes build + npm test',
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-express-api-ts-'));
      const targetDir = path.join(root, 'ts-api');

      try {
        await generateProject({
          config: {
            projectName: 'ts-api',
            language: 'ts',
            moduleSystem: 'commonjs',
            jsDevWatcher: 'node-watch',
            architecture: 'simple',
            educational: true,
            databaseMode: 'memory'
          },
          targetDir
        });

        await execa('npm', ['install', '--no-audit', '--no-fund'], { cwd: targetDir });
        const buildRun = await execa('npm', ['run', 'build'], { cwd: targetDir });
        const testRun = await execa('npm', ['test'], { cwd: targetDir });

        expect(buildRun.exitCode).toBe(0);
        expect(testRun.exitCode).toBe(0);
      } finally {
        await fs.remove(root);
      }
    },
    300000
  );

  it(
    'generates JS ES Modules in-memory project and passes npm test',
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), 'create-express-api-js-esm-'));
      const targetDir = path.join(root, 'js-api-esm');

      try {
        await generateProject({
          config: {
            projectName: 'js-api-esm',
            language: 'js',
            moduleSystem: 'esm',
            jsDevWatcher: 'node-watch',
            architecture: 'simple',
            educational: true,
            databaseMode: 'memory'
          },
          targetDir
        });

        await execa('npm', ['install', '--no-audit', '--no-fund'], { cwd: targetDir });
        const testRun = await execa('npm', ['test'], { cwd: targetDir });

        expect(testRun.exitCode).toBe(0);
      } finally {
        await fs.remove(root);
      }
    },
    300000
  );
});
