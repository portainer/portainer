import {
  BasicTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  createPersistedStore,
  hiddenColumnsSettings,
  refreshableSettings,
} from '@@/datatables/types';

export interface TableSettings
  extends BasicTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {
  showOrphanedStacks: boolean;
  setShowOrphanedStacks(value: boolean): void;
}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...refreshableSettings(set),
    showOrphanedStacks: false,
    setShowOrphanedStacks(showOrphanedStacks) {
      set((s) => ({ ...s, showOrphanedStacks }));
    },
  }));
}
