import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import ejs from 'ejs';

import {
  architectureLabel,
  databaseLabel,
  jsDevWatcherLabel,
  languageLabel,
  moduleSystemLabel,
} from '../core/labels.js';
import { toDatabaseName } from '../core/naming.js';
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

function resolveTemplateRoots(config: TemplateConfig): string[] {
  const templatesDir = resolveTemplatesDir();

  if (config.language === 'ts') {
    return [
      path.join(templatesDir, 'ts', 'shared'),
      path.join(templatesDir, 'ts', config.architecture),
    ];
  }

  return [path.join(templatesDir, config.language, config.architecture)];
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

function toPlannedFile(
  sourcePath: string,
  relativeTemplatePath: string,
): PlannedFile {
  return {
    templateSourcePath: sourcePath,
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

function getOsUsername(): string {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER ?? process.env.USERNAME ?? 'postgres';
  }
}

function templateData(config: TemplateConfig): Record<string, unknown> {
  const isTypeScript = config.language === 'ts';
  const isEsm = config.moduleSystem === 'esm';
  const isJavaScript = config.language === 'js';
  const useNodemon = isJavaScript && config.jsDevWatcher === 'nodemon';
  const isPostgres = config.databaseMode !== 'memory';
  const isDocker = config.databaseMode === 'postgres-docker';
  const isPsql = config.databaseMode === 'postgres-psql';
  const dbName = toDatabaseName(config.projectName);
  const username = isPostgres ? getOsUsername() : '';

  return {
    ...config,
    isTypeScript,
    isEsm,
    isCommonJs: !isEsm,
    isPostgres,
    isDocker,
    isPsql,
    packageName: toPackageName(config.projectName),
    databaseName: dbName,
    educationalLabel: config.educational ? 'On' : 'Off',
    languageLabel: languageLabel(config.language),
    moduleSystemLabel: moduleSystemLabel(config.moduleSystem),
    architectureLabel: architectureLabel(config.architecture),
    databaseLabel: databaseLabel(config.databaseMode),
    jsDevWatcherLabel: jsDevWatcherLabel(config.jsDevWatcher),
    jsDevCommand: useNodemon
      ? 'nodemon src/server.js'
      : 'node --watch src/server.js',
    useNodemon,
    databaseUrl:
      config.databaseMode === 'postgres-docker'
        ? `postgres://postgres:postgres@localhost:5433/${dbName}`
        : `postgres://${encodeURIComponent(username)}:postgres@localhost:5432/${dbName}`,
    osUsername: username,
  };
}

function fromPosixPath(relativePath: string): string {
  return relativePath.split('/').join(path.sep);
}

export async function planProject(
  config: TemplateConfig,
  targetDir: string,
): Promise<GenerationPlan> {
  const templateRoots = resolveTemplateRoots(config);

  for (const templateRoot of templateRoots) {
    const templateRootExists = await fs.pathExists(templateRoot);

    if (!templateRootExists) {
      throw new Error(`Template root not found: ${templateRoot}`);
    }
  }

  const templateFiles = new Map<string, string>();

  for (const templateRoot of templateRoots) {
    const allFiles = await listFilesRecursive(templateRoot);

    for (const file of allFiles) {
      const relativePath = toPosixPath(file);
      const sourcePath = path.join(templateRoot, fromPosixPath(relativePath));
      templateFiles.set(relativePath, sourcePath);
    }
  }

  const files = Array.from(templateFiles.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([relativePath]) => shouldIncludeTemplate(relativePath, config))
    .map(([relativePath, sourcePath]) => toPlannedFile(sourcePath, relativePath));

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
  const plan = await planProject(config, targetDir);

  if (dryRun) {
    return plan;
  }

  await fs.ensureDir(targetDir);

  const data = templateData(config);

  for (const file of plan.files) {
    const destinationPath = path.join(
      targetDir,
      fromPosixPath(file.outputRelativePath),
    );

    await fs.ensureDir(path.dirname(destinationPath));

    if (file.isTemplate) {
      const template = await fs.readFile(file.templateSourcePath, 'utf8');
      const rendered = ejs.render(template, data);
      await fs.writeFile(destinationPath, rendered, 'utf8');
      continue;
    }

    await fs.copy(file.templateSourcePath, destinationPath);
  }

  return plan;
}
