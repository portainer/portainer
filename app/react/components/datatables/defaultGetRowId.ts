export function defaultGetRowId<D extends Record<string, unknown>>(
  row: D
): string {
  if (row.id && (typeof row.id === 'string' || typeof row.id === 'number')) {
    return row.id.toString();
  }

  if (row.Id && (typeof row.Id === 'string' || typeof row.Id === 'number')) {
    return row.Id.toString();
  }

  if (row.ID && (typeof row.ID === 'string' || typeof row.ID === 'number')) {
    return row.ID.toString();
  }

  return '';
}
