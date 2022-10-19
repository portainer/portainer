export interface PaginationTableSettings {
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

type Set<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined
) => void;

export function paginationSettings(
  set: Set<PaginationTableSettings>
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
  set: Set<SortableTableSettings>,
  initialSortBy = 'name',
  desc = false
): SortableTableSettings {
  return {
    sortBy: { id: initialSortBy, desc },
    setSortBy: (id: string, desc: boolean) => set({ sortBy: { id, desc } }),
  };
}

export interface SettableColumnsTableSettings {
  hiddenColumns: string[];
  setHiddenColumns: (hiddenColumns: string[]) => void;
}

export function hiddenColumnsSettings(
  set: Set<SettableColumnsTableSettings>
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
  set: Set<RefreshableTableSettings>
): RefreshableTableSettings {
  return {
    autoRefreshRate: 0,
    setAutoRefreshRate: (autoRefreshRate: number) => set({ autoRefreshRate }),
  };
}
