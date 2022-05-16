import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@/react/components/datatables/types';

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}
