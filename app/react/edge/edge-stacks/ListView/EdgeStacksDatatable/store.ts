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
    RefreshableTableSettings {}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...refreshableSettings(set),
  }));
}
