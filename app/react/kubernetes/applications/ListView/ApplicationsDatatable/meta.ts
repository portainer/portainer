import { ApplicationRowData } from './types';

interface TableMeta {
  table: 'applications';
  isWorkflowManaged(app: ApplicationRowData): boolean;
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'applications'
  );
}

const defaultMeta: TableMeta = {
  table: 'applications',
  isWorkflowManaged: () => false,
};

export function getTableMeta(meta: unknown): TableMeta {
  if (!isTableMeta(meta)) {
    return defaultMeta;
  }

  return meta;
}
