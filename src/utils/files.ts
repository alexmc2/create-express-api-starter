import path from 'node:path';
import fs from 'fs-extra';

export async function assertSafeTargetDir(targetDir: string): Promise<void> {
  const exists = await fs.pathExists(targetDir);

  if (!exists) {
    return;
  }

  const stats = await fs.stat(targetDir);

  if (!stats.isDirectory()) {
    throw new Error(`Target path already exists and is not a directory: ${targetDir}`);
  }

  const entries = await fs.readdir(targetDir);
  if (entries.length > 0) {
    throw new Error(
      `Target directory "${path.basename(targetDir)}" already exists and is not empty.`
    );
  }
}
