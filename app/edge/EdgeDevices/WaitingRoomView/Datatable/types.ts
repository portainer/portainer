import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@@/datatables/types-old';

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}
