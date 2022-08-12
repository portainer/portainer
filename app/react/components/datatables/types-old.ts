export interface PaginationTableSettings {
  pageSize: number;
}

export interface SortableTableSettings {
  sortBy: { id: string; desc: boolean };
}

export interface SettableColumnsTableSettings {
  hiddenColumns: string[];
}

export interface RefreshableTableSettings {
  autoRefreshRate: number;
}
