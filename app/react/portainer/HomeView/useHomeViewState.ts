import {
  getSortTypeCaseInsensitive,
  SortType,
} from '@/react/portainer/environments/queries/useEnvironmentList';

import { useTableStateFromUrl } from '@@/datatables/useTableStateFromUrl';

const STORAGE_KEY = 'home_view_endpoints';
const DEFAULT_SORT = 'Id';

type Extra = {
  groupKey: SortType;
  setHeaderFilter: (sortBy: SortType, filter: string | null) => void;
};

export function useHomeViewState() {
  return useTableStateFromUrl<Record<never, never>, Extra>({
    localStorageKey: STORAGE_KEY,
    defaultSort: DEFAULT_SORT,
    defaultGroupBy: DEFAULT_SORT,
    buildExtra: (urlState, setUrlState) => {
      return {
        groupKey: urlState.groupBy
          ? (getSortTypeCaseInsensitive(urlState.groupBy) ?? DEFAULT_SORT)
          : DEFAULT_SORT,
        setHeaderFilter: (sortBy, filter) => {
          setUrlState({
            groupBy: sortBy.toString(),
            groupFilter: filter,
            order: 'asc',
            page: 0,
            search: '',
          });
        },
      };
    },
  });
}
