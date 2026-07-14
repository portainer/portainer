import { buildGroupSortExtras } from '@@/datatables/groupSortState';
import {
  asEnum,
  useTableStateFromUrl,
} from '@@/datatables/useTableStateFromUrl';

import { WorkflowStatus } from '../types';

const DEFAULT_SORT = 'name' as const;

const WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  'healthy',
  'error',
  'syncing',
  'paused',
  'unknown',
]);

export const SORT_KEYS = ['name', 'status', 'lastSyncDate'] as const;

const DIMENSIONS = [{ key: 'status' }];

export function useListState() {
  return useTableStateFromUrl({
    localStorageKey: 'workflows',
    defaultSort: DEFAULT_SORT,
    persistedExtraKeys: ['status'],
    parseExtra: (params) => ({
      status: asEnum(params.status, WORKFLOW_STATUSES),
    }),
    buildExtra: (urlState, setUrlState) => ({
      status: urlState.status,
      setStatus: (v: WorkflowStatus | null) =>
        setUrlState({ status: v, page: 0 }),
      ...buildGroupSortExtras({
        urlState,
        setUrlState,
        defaultSort: DEFAULT_SORT,
        sortKeys: SORT_KEYS,
        dimensions: DIMENSIONS,
      }),
    }),
  });
}
