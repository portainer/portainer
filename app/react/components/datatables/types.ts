import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

export interface PaginationTableSettings {
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

export type ZustandSetFunc<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined
) => void;

export function paginationSettings(
  set: ZustandSetFunc<PaginationTableSettings>
): PaginationTableSettings {
  return {
    pageSize: 10,
    setPageSize: (pageSize: number) => set({ pageSize }),
  };
}

export interface SortableTableSettings {
  sortBy: { id: string; desc: boolean };
  setSortBy: (id: string, desc: boolean) => void;
}

export function sortableSettings(
  set: ZustandSetFunc<SortableTableSettings>,
  initialSortBy: string | { id: string; desc: boolean }
): SortableTableSettings {
  return {
    sortBy:
      typeof initialSortBy === 'string'
        ? { id: initialSortBy, desc: false }
        : initialSortBy,
    setSortBy: (id: string, desc: boolean) => set({ sortBy: { id, desc } }),
  };
}

export interface SettableColumnsTableSettings {
  hiddenColumns: string[];
  setHiddenColumns: (hiddenColumns: string[]) => void;
}

export function hiddenColumnsSettings(
  set: ZustandSetFunc<SettableColumnsTableSettings>
): SettableColumnsTableSettings {
  return {
    hiddenColumns: [],
    setHiddenColumns: (hiddenColumns: string[]) => set({ hiddenColumns }),
  };
}

export interface RefreshableTableSettings {
  autoRefreshRate: number;
  setAutoRefreshRate: (autoRefreshRate: number) => void;
}

export function refreshableSettings(
  set: ZustandSetFunc<RefreshableTableSettings>
): RefreshableTableSettings {
  return {
    autoRefreshRate: 0,
    setAutoRefreshRate: (autoRefreshRate: number) => set({ autoRefreshRate }),
  };
}

export interface BasicTableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export function createPersistedStore<T extends BasicTableSettings>(
  storageKey: string,
  initialSortBy: string | { id: string; desc: boolean } = 'name',
  create: (set: ZustandSetFunc<T>) => Omit<T, keyof BasicTableSettings> = () =>
    ({} as T)
) {
  return createStore<T>()(
    persist(
      (set) =>
        ({
          ...sortableSettings(
            set as ZustandSetFunc<SortableTableSettings>,
            initialSortBy
          ),
          ...paginationSettings(set as ZustandSetFunc<PaginationTableSettings>),
          ...create(set),
        } as T),
      {
        name: keyBuilder(storageKey),
      }
    )
  );
}
