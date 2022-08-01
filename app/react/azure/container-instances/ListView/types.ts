import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@@/datatables/types';

export interface TableSettings
  extends PaginationTableSettings,
    SortableTableSettings {}
