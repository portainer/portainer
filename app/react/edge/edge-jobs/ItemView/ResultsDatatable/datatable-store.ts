import {
  refreshableSettings,
  createPersistedStore,
  BasicTableSettings,
  RefreshableTableSettings,
  BackendPaginationTableSettings,
  backendPaginationSettings,
} from '@@/datatables/types';

interface TableSettings
  extends
    BasicTableSettings,
    RefreshableTableSettings,
    BackendPaginationTableSettings {}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, undefined, (set) => ({
    ...refreshableSettings(set),
    ...backendPaginationSettings(set),
  }));
}
