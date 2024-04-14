interface TableMeta {
  table: 'registry-repository-tags';
  onUpdate(): void;
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'registry-repository-tags'
  );
}

export function getTableMeta(meta: unknown): TableMeta {
  if (!isTableMeta(meta)) {
    throw new Error('Invalid table meta');
  }

  return meta;
}
