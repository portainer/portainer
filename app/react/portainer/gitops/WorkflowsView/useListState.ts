import { buildGroupSortExtras } from '@@/datatables/groupSortState';
import {
  asEnum,
  useTableStateFromUrl,
} from '@@/datatables/useTableStateFromUrl';

import { WorkflowStatus, WorkflowType, DeploymentPlatform } from './types';

const DEFAULT_SORT = 'name' as const;

const WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  'healthy',
  'error',
  'syncing',
  'paused',
  'unknown',
]);
const WORKFLOW_TYPES = new Set<WorkflowType>(['stack', 'edgeStack']);
const DEPLOYMENT_PLATFORMS = new Set<DeploymentPlatform>([
  'dockerStandalone',
  'dockerSwarm',
  'kubernetes',
]);

const SORT_KEYS = [
  'name',
  'status',
  'type',
  'platform',
  'lastSyncDate',
] as const;

const DIMENSIONS = [{ key: 'status' }, { key: 'type' }, { key: 'platform' }];

export function useListState() {
  return useTableStateFromUrl({
    localStorageKey: 'workflows',
    defaultSort: DEFAULT_SORT,
    parseExtra: (params) => ({
      status: asEnum(params.status, WORKFLOW_STATUSES),
      type: asEnum(params.type, WORKFLOW_TYPES),
      platform: asEnum(params.platform, DEPLOYMENT_PLATFORMS),
    }),
    buildExtra: (urlState, setUrlState) => ({
      status: urlState.status,
      type: urlState.type,
      platform: urlState.platform,
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
