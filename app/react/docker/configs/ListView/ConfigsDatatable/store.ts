import {
  createPersistedStore,
  refreshableSettings,
  TableSettingsWithRefreshable,
} from '@@/datatables/types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettingsWithRefreshable>(
    storageKey,
    'name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
}
