import pc from 'picocolors';

type StatusTone = 'info' | 'success' | 'warn' | 'error';
type ValueTone = 'default' | 'accent' | 'success' | 'warn' | 'muted';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '');
}

function displayLength(value: string): number {
  return stripAnsi(value).length;
}

function padDisplay(value: string, width: number): string {
  const padding = width - displayLength(value);
  if (padding <= 0) {
    return value;
  }

  return `${value}${' '.repeat(padding)}`;
}

function minimumContentWidth(lines: string[]): number {
  return lines.reduce((max, line) => {
    return Math.max(max, displayLength(line));
  }, 0);
}

function styleValue(value: string, tone: ValueTone): string {
  if (tone === 'accent') {
    return pc.cyan(value);
  }

  if (tone === 'success') {
    return pc.green(value);
  }

  if (tone === 'warn') {
    return pc.yellow(value);
  }

  if (tone === 'muted') {
    return pc.dim(value);
  }

  return value;
}

export function statusTag(tone: StatusTone): string {
  if (tone === 'success') {
    return pc.bold(pc.green('[ok]'));
  }

  if (tone === 'warn') {
    return pc.bold(pc.yellow('[!!]'));
  }

  if (tone === 'error') {
    return pc.bold(pc.red('[x]'));
  }

  return pc.bold(pc.cyan('[..]'));
}

interface KeyValueRow {
  key: string;
  value: string;
  tone?: ValueTone;
}

export function formatKeyValueLines(rows: KeyValueRow[]): string[] {
  const keyWidth = rows.reduce((max, row) => Math.max(max, row.key.length), 0);

  return rows.map((row) => {
    const key = pc.bold(padDisplay(row.key, keyWidth));
    const value = styleValue(row.value, row.tone ?? 'default');
    return `${key}  ${value}`;
  });
}

export function formatCommandLines(commands: string[]): string[] {
  return commands.map((command) => pc.bold(pc.cyan(command)));
}

export function printCard(title: string, lines: string[]): void {
  const content = lines.length > 0 ? lines : [pc.dim('(none)')];
  const width = Math.max(30, minimumContentWidth([title, ...content]));

  const border = pc.dim(pc.cyan(`+${'-'.repeat(width + 2)}+`));
  const edge = pc.dim(pc.cyan('|'));
  const divider = pc.dim('-'.repeat(width));

  console.log(border);
  console.log(
    `${edge} ${padDisplay(pc.bold(pc.cyan(title)), width)} ${edge}`,
  );
  console.log(`${edge} ${divider} ${edge}`);

  for (const line of content) {
    console.log(`${edge} ${padDisplay(line, width)} ${edge}`);
  }

  console.log(border);
}
