import create from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/portainer/hooks/useLocalStorage';
import {
  paginationSettings,
  sortableSettings,
  refreshableSettings,
  hiddenColumnsSettings,
} from '@/react/components/datatables/types';

import { QuickAction, TableSettings } from './types';

export function createStore(storageKey: string) {
  return create<TableSettings>()(
    persist(
      (set) => ({
        ...sortableSettings(set),
        ...paginationSettings(set),
        ...hiddenColumnsSettings(set),
        ...refreshableSettings(set),
        truncateContainerName: 32,
        setTruncateContainerName: (truncateContainerName: number) =>
          set({
            truncateContainerName,
          }),

        hiddenQuickActions: [],
        setHiddenQuickActions: (hiddenQuickActions: QuickAction[]) =>
          set({ hiddenQuickActions }),
      }),
      {
        name: keyBuilder(storageKey),
      }
    )
  );
}
