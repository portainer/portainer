import { buildGroupSortExtras } from '@@/datatables/groupSortState';
import {
  asEnum,
  useTableStateFromUrl,
} from '@@/datatables/useTableStateFromUrl';

import { SourceStatus, SourceType } from '../types';

const DEFAULT_SORT = 'name' as const;

const SOURCE_STATUSES = new Set<SourceStatus>([
  'healthy',
  'error',
  'syncing',
  'paused',
  'unknown',
]);

const SOURCE_TYPES = new Set<SourceType>(['git', 'helm', 'oci']);

const SORT_KEYS = ['name', 'status', 'type'] as const;

const DIMENSIONS = [{ key: 'status' }, { key: 'type' }];

export function useListState() {
  return useTableStateFromUrl({
    localStorageKey: 'sources',
    defaultSort: DEFAULT_SORT,
    parseExtra: (params) => ({
      status: asEnum(params.status, SOURCE_STATUSES),
      type: asEnum(params.type, SOURCE_TYPES),
    }),
    buildExtra: (urlState, setUrlState) => ({
      status: urlState.status,
      type: urlState.type,
      setStatus: (v: SourceStatus | null) =>
        setUrlState({ status: v, page: 0 }),
      setType: (v: SourceType | null) => setUrlState({ type: v, page: 0 }),
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
