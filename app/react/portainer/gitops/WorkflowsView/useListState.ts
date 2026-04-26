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

export function useListState() {
  return useTableStateFromUrl({
    localStorageKey: 'workflows',
    defaultSort: DEFAULT_SORT,
    parseExtra: (params) => ({
      status: asEnum(params.status, WORKFLOW_STATUSES),
      type: asEnum(params.type, WORKFLOW_TYPES),
      platform: asEnum(params.platform, DEPLOYMENT_PLATFORMS),
    }),
    buildExtra: (urlState, setUrlState) => {
      const sortKey = toSortKey(urlState.sort);
      return {
        status: urlState.status,
        type: urlState.type,
        platform: urlState.platform,
        setStatus: (v: WorkflowStatus | null) =>
          setUrlState({ status: v, page: 0 }),
        groupFilter: getGroupFilter(sortKey, urlState),

        setGroupFilter: (value: string | null) => {
          if (sortKey === 'status') {
            setUrlState({ status: value as WorkflowStatus | null, page: 0 });
          } else if (sortKey === 'type') {
            setUrlState({
              type: value as WorkflowType | null,
              page: 0,
            });
          } else if (sortKey === 'platform') {
            setUrlState({
              platform: value as DeploymentPlatform | null,
              page: 0,
            });
          }
        },
        setSortBy: (id: string, desc: boolean) =>
          setUrlState({
            sort: id ?? DEFAULT_SORT,
            order: desc ? 'desc' : 'asc',
            // Clear status filter only if was previously grouped by status
            ...(id === 'status' ? { status: null } : {}),
            type: null,
            platform: null,
            page: 0,
          }),
      };
    },
  });
}

function getGroupFilter(
  sortKey: SortKey,
  urlState: {
    status: WorkflowStatus | null;
    type: WorkflowType | null;
    platform: DeploymentPlatform | null;
  }
) {
  switch (sortKey) {
    case 'status':
      return urlState.status;
    case 'platform':
      return urlState.platform;
    case 'type':
      return urlState.type;
    case 'name':
    case 'lastSyncDate':
      return null;
  }
}

const SORT_KEYS = [
  'name',
  'status',
  'type',
  'platform',
  'lastSyncDate',
] as const;

type SortKey = (typeof SORT_KEYS)[number];

function toSortKey(sort: string): SortKey {
  return (SORT_KEYS as readonly string[]).includes(sort)
    ? (sort as SortKey)
    : DEFAULT_SORT;
}
