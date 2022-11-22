import {
  refreshableSettings,
  hiddenColumnsSettings,
  createPersistedStore,
} from '@@/datatables/types';

import { QuickAction, TableSettings } from './types';

export const TRUNCATE_LENGTH = 32;

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'Name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...refreshableSettings(set),
    truncateContainerName: TRUNCATE_LENGTH,
    setTruncateContainerName(truncateContainerName: number) {
      set({
        truncateContainerName,
      });
    },

    hiddenQuickActions: [] as QuickAction[],
    setHiddenQuickActions: (hiddenQuickActions: QuickAction[]) =>
      set({ hiddenQuickActions }),
  }));
}
