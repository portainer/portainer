interface TableMeta {
  isBrowseVisible: boolean;
  table: 'volumes';
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'volumes'
  );
}

export function getTableMeta(meta?: unknown): TableMeta {
  if (!isTableMeta(meta)) {
    return {
      isBrowseVisible: false,
      table: 'volumes',
    };
  }

  return {
    isBrowseVisible: meta.isBrowseVisible,
    table: 'volumes',
  };
}
