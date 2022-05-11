import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@/portainer/components/datatables/types';

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}
