type TableMeta = {
  serviceName: string;
  table: 'tasks';
};

export function getTableMeta(meta: unknown): TableMeta {
  return isTableMeta(meta) ? meta : { table: 'tasks', serviceName: '' };
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'tasks'
  );
}
