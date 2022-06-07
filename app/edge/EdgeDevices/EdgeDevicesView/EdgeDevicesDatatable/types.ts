import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@/portainer/components/datatables/types';

export interface Pagination {
  pageLimit: number;
  page: number;
}

export interface EdgeDeviceTableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}
