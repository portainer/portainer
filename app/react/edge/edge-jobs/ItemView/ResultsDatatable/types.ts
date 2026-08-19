import { EdgeJob } from '../../types';

interface TableMeta {
  table: 'edge-job-results';
  jobId: EdgeJob['Id'];
}

function isTableMeta(meta: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'edge-job-results'
  );
}

export function getTableMeta(meta: unknown): TableMeta {
  if (!isTableMeta(meta)) {
    throw new Error('missing correct table meta');
  }

  return meta;
}
