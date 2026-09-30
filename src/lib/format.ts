export function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatSize(bytes: number): string {
  if (!bytes) return '0 KB';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}
