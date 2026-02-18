export function toDatabaseName(projectName: string): string {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  return (cleaned || 'express_api') + '_dev';
}
