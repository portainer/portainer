import { useMemo, useState } from 'react';
import { useStore } from 'zustand';

import { useSearchBarState } from './SearchBar';
import { BasicTableSettings, createPersistedStore } from './types';

export type TableState<TSettings extends BasicTableSettings> = TSettings & {
  setSearch: (search: string) => void;
  search: string;
};

export function useTableState<
  TSettings extends BasicTableSettings = BasicTableSettings,
>(
  store: ReturnType<typeof createPersistedStore<TSettings>>,
  storageKey: string
) {
  const settings = useStore(store);

  const [search, setSearch] = useSearchBarState(storageKey);

  return useMemo(
    () => ({ ...settings, setSearch, search }),
    [settings, search, setSearch]
  );
}

export function useTableStateWithStorage<T extends BasicTableSettings>(
  ...args: Parameters<typeof createPersistedStore<T>>
) {
  const [store] = useState(() => createPersistedStore(...args));
  return useTableState(store, args[0]);
}

export function useTableStateWithoutStorage(
  defaultSortKey?: string,
  defaultSortDesc: boolean = false
): BasicTableSettings & {
  setSearch: (search: string) => void;
  search: string;
} {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState(
    defaultSortKey ? { id: defaultSortKey, desc: defaultSortDesc } : undefined
  );

  return {
    search,
    setSearch,
    pageSize,
    setPageSize,
    setSortBy: (id: string | undefined, desc: boolean) =>
      setSortBy(id ? { id, desc } : undefined),
    sortBy,
  };
}
