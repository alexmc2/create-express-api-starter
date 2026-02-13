import path from 'node:path';

export function validateProjectName(projectName: string): string | null {
  const trimmed = projectName.trim();

  if (!trimmed) {
    return 'Project name is required.';
  }

  if (trimmed === '.' || trimmed === '..') {
    return 'Project name cannot be "." or "..".';
  }

  if (trimmed !== path.basename(trimmed)) {
    return 'Project name must be a folder name, not a path.';
  }

  if (/[^a-zA-Z0-9._-]/.test(trimmed)) {
    return 'Project name can only include letters, numbers, ".", "_", and "-".';
  }

  return null;
}
