import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';

import { generateProject, planProject } from '../src/generator/index.js';
import type { TemplateConfig } from '../src/core/types.js';

async function createTempRoot(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

function getExpectedUsername(): string {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER ?? process.env.USERNAME ?? 'postgres';
  }
}

const jsSimpleMemory: TemplateConfig = {
  projectName: 'my-api',
  language: 'js',
  moduleSystem: 'commonjs',
  architecture: 'simple',
  educational: true,
  databaseMode: 'memory',
};

describe('generator', () => {
  it('creates key files for a JS simple in-memory project', async () => {
    const root = await createTempRoot('create-express-api-starter-');
    const targetDir = path.join(root, 'my-api');

    try {
      await generateProject({ config: jsSimpleMemory, targetDir });

      const expectedFiles = [
        'src/app.js',
        'src/server.js',
        'src/utils/getPort.js',
        'package.json',
        'README.md',
        '__tests__/app.test.js',
        '.env.example',
        '.gitignore',
      ];

      for (const file of expectedFiles) {
        const exists = await fs.pathExists(path.join(targetDir, file));
        expect(exists).toBe(true);
      }
    } finally {
      await fs.remove(root);
    }
  });

  it('renders expected scripts/dependencies for TS MVC Postgres Docker', async () => {
    const root = await createTempRoot('create-express-api-starter-');
    const targetDir = path.join(root, 'my-api-ts');

    try {
      await generateProject({
        config: {
          projectName: 'my-api-ts',
          language: 'ts',
          moduleSystem: 'commonjs',
          architecture: 'mvc',
          educational: false,
          databaseMode: 'postgres-docker',
        },
        targetDir,
      });

      const packageJsonPath = path.join(targetDir, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);

      expect(packageJson.scripts.dev).toBe('tsx watch src/server.ts');
      expect(packageJson.scripts.build).toBe('tsc');
      expect(packageJson.scripts['db:setup']).toBe('node scripts/dbSetup.js');
      expect(packageJson.scripts['db:seed']).toBe('node scripts/dbSeed.js');
      expect(packageJson.dependencies.pg).toBeDefined();
      expect(packageJson.devDependencies['@swc/jest']).toBeDefined();
      expect(packageJson.devDependencies['@swc/core']).toBeDefined();

      const readme = await fs.readFile(
        path.join(targetDir, 'README.md'),
        'utf8',
      );
      expect(readme).toContain('Language: TypeScript');
      expect(readme).toContain('Architecture: MVC');
      expect(readme).toContain('Database: Postgres (Docker)');
      expect(readme).toContain('Educational comments: Off');

      const tsconfig = await fs.readJson(path.join(targetDir, 'tsconfig.json'));
      expect(tsconfig.compilerOptions.module).toBe('node16');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('node16');
      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
      expect(tsconfig.compilerOptions.rootDir).toBe('./src');

      expect(await fs.pathExists(path.join(targetDir, 'compose.yaml'))).toBe(
        true,
      );
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbSetup.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbSeed.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbReset.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'src/utils/getPort.ts')),
      ).toBe(true);
    } finally {
      await fs.remove(root);
    }
  });

  it('renders JS simple ES Modules project with ESM-safe test configuration', async () => {
    const root = await createTempRoot('create-express-api-starter-');
    const targetDir = path.join(root, 'my-api-esm');

    try {
      await generateProject({
        config: {
          projectName: 'my-api-esm',
          language: 'js',
          moduleSystem: 'esm',
          architecture: 'simple',
          educational: true,
          databaseMode: 'memory',
        },
        targetDir,
      });

      const packageJson = await fs.readJson(path.join(targetDir, 'package.json'));
      expect(packageJson.type).toBe('module');
      expect(packageJson.scripts.test).toBe(
        'node --experimental-vm-modules ./node_modules/jest/bin/jest.js',
      );

      const appFile = await fs.readFile(path.join(targetDir, 'src/app.js'), 'utf8');
      expect(appFile).toContain("import express from 'express';");
      expect(appFile).toContain('export default app;');

      const jestConfig = await fs.readFile(
        path.join(targetDir, 'jest.config.js'),
        'utf8',
      );
      expect(jestConfig).toContain('export default');
    } finally {
      await fs.remove(root);
    }
  });

  it('renders JS simple postgres-psql project with osUsername in README and .env', async () => {
    const root = await createTempRoot('create-express-api-starter-');
    const targetDir = path.join(root, 'my-api-psql');

    try {
      await generateProject({
        config: {
          projectName: 'my-api-psql',
          language: 'js',
          moduleSystem: 'commonjs',
          architecture: 'simple',
          educational: true,
          databaseMode: 'postgres-psql',
        },
        targetDir,
      });

      const expectedUsername = getExpectedUsername();

      const readme = await fs.readFile(
        path.join(targetDir, 'README.md'),
        'utf8',
      );
      expect(readme).toContain('Database: Postgres (psql)');
      expect(readme).toContain(`connects as \`${expectedUsername}\``);
      expect(readme).toContain('Prerequisites');
      expect(readme).toContain('Set up your database role');

      const envExample = await fs.readFile(
        path.join(targetDir, '.env.example'),
        'utf8',
      );
      const encodedUsername = encodeURIComponent(expectedUsername);
      expect(envExample).toContain(
        `postgres://${encodedUsername}:postgres@localhost:5432/my_api_psql_dev`,
      );

      const errorHandler = await fs.readFile(
        path.join(targetDir, 'src/middleware/errorHandler.js'),
        'utf8',
      );
      expect(errorHandler).toContain(`error?.code === '23505'`);
      expect(errorHandler).toContain('status: 409');
      expect(errorHandler).toContain('A user with this email already exists.');

      const dbCreate = await fs.readFile(
        path.join(targetDir, 'scripts/dbCreate.js'),
        'utf8',
      );
      expect(dbCreate).toContain('const message =');
      expect(dbCreate).toContain('const code =');
      expect(dbCreate).toContain('const connectionRefused =');

      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbCreate.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbSetup.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbSeed.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(targetDir, 'scripts/dbReset.js')),
      ).toBe(true);
    } finally {
      await fs.remove(root);
    }
  });

  it('supports dry-run plan without writing files', async () => {
    const root = await createTempRoot('create-express-api-starter-');
    const targetDir = path.join(root, 'dry-run-api');

    try {
      const plan = await generateProject({
        config: {
          projectName: 'dry-run-api',
          language: 'js',
          moduleSystem: 'commonjs',
          architecture: 'mvc',
          educational: true,
          databaseMode: 'memory',
        },
        targetDir,
        dryRun: true,
      });

      expect(plan.files.length).toBeGreaterThan(0);
      expect(await fs.pathExists(targetDir)).toBe(false);

      const explicitPlan = await planProject(
        jsSimpleMemory,
        path.join(root, 'another-api'),
      );
      expect(
        explicitPlan.files.some(
          (file) => file.outputRelativePath === 'package.json',
        ),
      ).toBe(true);
    } finally {
      await fs.remove(root);
    }
  });
});
