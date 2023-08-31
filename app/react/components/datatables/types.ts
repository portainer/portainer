import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

export type DefaultType = object;

export interface PaginationTableSettings {
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

export type ZustandSetFunc<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined
) => void;

export function paginationSettings<T extends PaginationTableSettings>(
  set: ZustandSetFunc<T>
): PaginationTableSettings {
  return {
    pageSize: 10,
    setPageSize: (pageSize: number) => set((s) => ({ ...s, pageSize })),
  };
}

export interface SortableTableSettings {
  sortBy: { id: string; desc: boolean } | undefined;
  setSortBy: (id: string | undefined, desc: boolean) => void;
}

export function sortableSettings<T extends SortableTableSettings>(
  set: ZustandSetFunc<T>,
  initialSortBy?: string | { id: string; desc: boolean }
): SortableTableSettings {
  return {
    sortBy:
      typeof initialSortBy === 'string'
        ? { id: initialSortBy, desc: false }
        : initialSortBy,
    setSortBy: (id: string | undefined, desc: boolean) =>
      set((s) => ({
        ...s,
        sortBy: typeof id === 'string' ? { id, desc } : id,
      })),
  };
}

export interface SettableColumnsTableSettings {
  hiddenColumns: string[];
  setHiddenColumns: (hiddenColumns: string[]) => void;
}

export function hiddenColumnsSettings<T extends SettableColumnsTableSettings>(
  set: ZustandSetFunc<T>
): SettableColumnsTableSettings {
  return {
    hiddenColumns: [],
    setHiddenColumns: (hiddenColumns: string[]) =>
      set((s) => ({ ...s, hiddenColumns })),
  };
}

export interface RefreshableTableSettings {
  autoRefreshRate: number;
  setAutoRefreshRate: (autoRefreshRate: number) => void;
}

export function refreshableSettings<T extends RefreshableTableSettings>(
  set: ZustandSetFunc<T>
): RefreshableTableSettings {
  return {
    autoRefreshRate: 0,
    setAutoRefreshRate: (autoRefreshRate: number) =>
      set((s) => ({ ...s, autoRefreshRate })),
  };
}

export interface BasicTableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export function createPersistedStore<T extends BasicTableSettings>(
  storageKey: string,
  initialSortBy?: string | { id: string; desc: boolean },
  create: (set: ZustandSetFunc<T>) => Omit<T, keyof BasicTableSettings> = () =>
    ({} as T)
) {
  return createStore<T>()(
    persist(
      (set) =>
        ({
          ...sortableSettings<T>(set, initialSortBy),
          ...paginationSettings<T>(set),
          ...create(set),
        } as T),
      {
        name: `datatable_settings_${keyBuilder(storageKey)}`,
      }
    )
  );
}
