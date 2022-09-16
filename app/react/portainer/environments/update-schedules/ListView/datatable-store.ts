import create from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/portainer/hooks/useLocalStorage';
import {
  paginationSettings,
  sortableSettings,
  refreshableSettings,
  hiddenColumnsSettings,
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@/react/components/datatables/types';

interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}

export function createStore(storageKey: string) {
  return create<TableSettings>()(
    persist(
      (set) => ({
        ...sortableSettings(set),
        ...paginationSettings(set),
        ...hiddenColumnsSettings(set),
        ...refreshableSettings(set),
      }),
      {
        name: keyBuilder(storageKey),
      }
    )
  );
}
