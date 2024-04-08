import {
  refreshableSettings,
  createPersistedStore,
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, undefined, (set) => ({
    ...refreshableSettings(set),
  }));
}
