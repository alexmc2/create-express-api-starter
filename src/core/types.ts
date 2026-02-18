export type Language = 'js' | 'ts';

export type Architecture = 'simple' | 'mvc';

export type DatabaseMode = 'memory' | 'postgres-psql' | 'postgres-docker';

export type ModuleSystem = 'commonjs' | 'esm';

export type JsDevWatcher = 'node-watch' | 'nodemon';

export interface CliFlags {
  yes: boolean;
  dryRun: boolean;
  install: boolean;
  git: boolean;
  verbose: boolean;
}

export interface FlagPresence {
  yes: boolean;
  dryRun: boolean;
  install: boolean;
  git: boolean;
  verbose: boolean;
}

export interface ParsedArgs {
  projectName?: string;
  positionals: string[];
  unknownFlags: string[];
  flags: CliFlags;
  provided: FlagPresence;
}

export interface UserSelections {
  projectName: string;
  language: Language;
  moduleSystem: ModuleSystem;
  jsDevWatcher: JsDevWatcher;
  architecture: Architecture;
  databaseMode: DatabaseMode;
  educational: boolean;
  installDeps: boolean;
  initGit: boolean;
  dryRun: boolean;
}

export interface TemplateConfig {
  projectName: string;
  language: Language;
  moduleSystem: ModuleSystem;
  jsDevWatcher: JsDevWatcher;
  architecture: Architecture;
  educational: boolean;
  databaseMode: DatabaseMode;
}

export interface PlannedFile {
  templateSourcePath: string;
  templateRelativePath: string;
  outputRelativePath: string;
  isTemplate: boolean;
}

export interface GenerationPlan {
  targetDir: string;
  files: PlannedFile[];
  actions: string[];
}
