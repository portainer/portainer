import { useMemo, useState } from 'react';
import { useStore } from 'zustand';

import { useSearchBarState } from './SearchBar';
import { BasicTableSettings, CreatePersistedStoreReturn } from './types';

export type TableState<TSettings extends BasicTableSettings> = TSettings & {
  setSearch: (search: string) => void;
  search: string;
};

export function useTableState<
  TSettings extends BasicTableSettings = BasicTableSettings
>(store: CreatePersistedStoreReturn<TSettings>, storageKey: string) {
  const settings = useStore(store);

  const [search, setSearch] = useSearchBarState(storageKey);

  return useMemo(
    () => ({ ...settings, setSearch, search }),
    [settings, search, setSearch]
  );
}

export function useTableStateWithoutStorage(
  defaultSortKey: string
): BasicTableSettings & {
  setSearch: (search: string) => void;
  search: string;
} {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState({ id: defaultSortKey, desc: false });

  return {
    search,
    setSearch,
    pageSize,
    setPageSize,
    setSortBy: (id: string, desc: boolean) => setSortBy({ id, desc }),
    sortBy,
  };
}
