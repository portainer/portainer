import { useMemo, useState } from 'react';

import {
  BasicTableSettings,
  createPersistedStore,
  ZustandSetFunc,
} from '@@/datatables/types';
import { useTableState, TableState } from '@@/datatables/useTableState';

interface GroupSortTableSettings extends BasicTableSettings {
  page: number;
  setPage: (page: number) => void;
  groupBy: string | null;
  setGroupBy: (filter: string | null) => void;
}

export type GroupSortTableState = TableState<GroupSortTableSettings>;

function groupSortTableExtras(
  set: ZustandSetFunc<GroupSortTableSettings>
): Partial<GroupSortTableSettings> {
  return {
    page: 1,
    setPage: (page: number) => set((s) => ({ ...s, page })),
    groupBy: null,
    setGroupBy: (filter: string | null) =>
      set((s) => ({ ...s, groupBy: filter })),
  };
}

function createGroupSortTableStore(
  storageKey: string,
  defaultSort?: string,
  defaultPageSize: number = 10
) {
  return createPersistedStore<GroupSortTableSettings>(
    storageKey,
    defaultSort,
    (set) => ({ ...groupSortTableExtras(set), pageSize: defaultPageSize })
  );
}

export function useGroupSortTableState(
  storageKey: string,
  defaultSort?: string,
  defaultPageSize: number = 10
): GroupSortTableState {
  const [store] = useState(() =>
    createGroupSortTableStore(storageKey, defaultSort, defaultPageSize)
  );
  return useTableState(store, storageKey);
}

export function useTestingGroupSortTableStateWithoutStorage(
  defaultSort?: string
): GroupSortTableState {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [sortBy, setSortByState] = useState(
    defaultSort ? { id: defaultSort, desc: false } : undefined
  );

  return useMemo(
    () => ({
      search,
      setSearch,
      pageSize,
      setPageSize,
      page,
      setPage,
      groupBy,
      setGroupBy,
      sortBy,
      setSortBy: (id: string | undefined, desc: boolean) =>
        setSortByState(id ? { id, desc } : undefined),
    }),

    [search, pageSize, page, groupBy, sortBy]
  );
}
