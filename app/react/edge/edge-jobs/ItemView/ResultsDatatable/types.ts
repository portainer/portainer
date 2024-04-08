import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';

import { JobResult } from '../../types';

export interface DecoratedJobResult extends JobResult {
  Endpoint: Environment;
}

interface TableMeta {
  table: 'edge-job-results';
  collectLogs(envId: EnvironmentId): void;
  downloadLogs(envId: EnvironmentId): void;
  clearLogs(envId: EnvironmentId): void;
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
