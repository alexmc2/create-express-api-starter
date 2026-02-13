import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli/index.ts'
  },
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node'
  }
});
