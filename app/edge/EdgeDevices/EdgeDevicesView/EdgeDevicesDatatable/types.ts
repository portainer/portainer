import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@@/datatables/types-old';

export interface Pagination {
  pageLimit: number;
  page: number;
}

export interface EdgeDeviceTableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}
