import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import ejs from 'ejs';

import {
  architectureLabel,
  databaseLabel,
  languageLabel,
} from '../core/labels.js';
import type {
  GenerationPlan,
  PlannedFile,
  TemplateConfig,
} from '../core/types.js';
import { resolveTemplatesDir } from '../utils/paths.js';

interface GenerateProjectInput {
  config: TemplateConfig;
  targetDir: string;
  dryRun?: boolean;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

function isEjsTemplate(relativePath: string): boolean {
  return relativePath.endsWith('.ejs');
}

function stripEjsSuffix(relativePath: string): string {
  return relativePath.endsWith('.ejs')
    ? relativePath.slice(0, -'.ejs'.length)
    : relativePath;
}

function resolveTemplateRoot(config: TemplateConfig): string {
  const templatesDir = resolveTemplatesDir();
  return path.join(templatesDir, config.language, config.architecture);
}

async function listFilesRecursive(
  directory: string,
  baseDir: string = directory,
): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));
  const results: string[] = [];

  for (const entry of sortedEntries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const childEntries = await listFilesRecursive(entryPath, baseDir);
      results.push(...childEntries);
      continue;
    }

    results.push(path.relative(baseDir, entryPath));
  }

  return results;
}

function shouldIncludeTemplate(
  relativePath: string,
  config: TemplateConfig,
): boolean {
  if (relativePath === 'compose.yaml.ejs') {
    return config.databaseMode === 'postgres-docker';
  }

  if (relativePath === 'scripts/dbCreate.js.ejs') {
    return config.databaseMode === 'postgres-psql';
  }

  if (relativePath.startsWith('scripts/')) {
    return config.databaseMode !== 'memory';
  }

  if (relativePath.startsWith('db/')) {
    return config.databaseMode !== 'memory';
  }

  if (relativePath.startsWith('src/db/')) {
    return config.databaseMode !== 'memory';
  }

  return true;
}

function toPlannedFile(relativeTemplatePath: string): PlannedFile {
  return {
    templateRelativePath: relativeTemplatePath,
    outputRelativePath: stripEjsSuffix(relativeTemplatePath),
    isTemplate: isEjsTemplate(relativeTemplatePath),
  };
}

function toPackageName(projectName: string): string {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return cleaned || 'express-api';
}

function toDatabaseName(projectName: string): string {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  return (cleaned || 'express_api') + '_dev';
}

function templateData(config: TemplateConfig): Record<string, unknown> {
  const isTypeScript = config.language === 'ts';
  const isPostgres = config.databaseMode !== 'memory';
  const isDocker = config.databaseMode === 'postgres-docker';
  const isPsql = config.databaseMode === 'postgres-psql';
  const dbName = toDatabaseName(config.projectName);

  return {
    ...config,
    isTypeScript,
    isPostgres,
    isDocker,
    isPsql,
    packageName: toPackageName(config.projectName),
    databaseName: dbName,
    educationalLabel: config.educational ? 'On' : 'Off',
    languageLabel: languageLabel(config.language),
    architectureLabel: architectureLabel(config.architecture),
    databaseLabel: databaseLabel(config.databaseMode),
    databaseUrl:
      config.databaseMode === 'postgres-docker'
        ? `postgres://postgres:postgres@localhost:5433/${dbName}`
        : `postgres://${encodeURIComponent(os.userInfo().username)}:postgres@localhost:5432/${dbName}`,
    osUsername: os.userInfo().username,
  };
}

function fromPosixPath(relativePath: string): string {
  return relativePath.split('/').join(path.sep);
}

export async function planProject(
  config: TemplateConfig,
  targetDir: string,
): Promise<GenerationPlan> {
  const templateRoot = resolveTemplateRoot(config);
  const templateRootExists = await fs.pathExists(templateRoot);

  if (!templateRootExists) {
    throw new Error(`Template root not found: ${templateRoot}`);
  }

  const allFiles = await listFilesRecursive(templateRoot);

  const files = allFiles
    .map(toPosixPath)
    .filter((relativePath) => shouldIncludeTemplate(relativePath, config))
    .map(toPlannedFile);

  return {
    targetDir,
    actions: [
      `Create project directory: ${targetDir}`,
      `Write ${files.length} files`,
    ],
    files,
  };
}

export async function generateProject({
  config,
  targetDir,
  dryRun = false,
}: GenerateProjectInput): Promise<GenerationPlan> {
  const templateRoot = resolveTemplateRoot(config);
  const plan = await planProject(config, targetDir);

  if (dryRun) {
    return plan;
  }

  await fs.ensureDir(targetDir);

  const data = templateData(config);

  for (const file of plan.files) {
    const sourcePath = path.join(
      templateRoot,
      fromPosixPath(file.templateRelativePath),
    );
    const destinationPath = path.join(
      targetDir,
      fromPosixPath(file.outputRelativePath),
    );

    await fs.ensureDir(path.dirname(destinationPath));

    if (file.isTemplate) {
      const template = await fs.readFile(sourcePath, 'utf8');
      const rendered = ejs.render(template, data);
      await fs.writeFile(destinationPath, rendered, 'utf8');
      continue;
    }

    await fs.copy(sourcePath, destinationPath);
  }

  return plan;
}
