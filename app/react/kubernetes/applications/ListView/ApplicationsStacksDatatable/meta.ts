import { Application } from '@/react/kubernetes/applications/ListView/ApplicationsDatatable/types';

interface TableMeta {
  table: 'applications-stacks';
  isWorkflowManaged(app: Application): boolean;
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'applications-stacks'
  );
}

const defaultMeta: TableMeta = {
  table: 'applications-stacks',
  isWorkflowManaged: () => false,
};

export function getTableMeta(meta: unknown): TableMeta {
  if (!isTableMeta(meta)) {
    return defaultMeta;
  }

  return meta;
}
