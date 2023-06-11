import { refreshableSettings, createPersistedStore } from '@@/datatables/types';

import {
  systemResourcesSettings,
  TableSettings,
} from './DefaultDatatableSettings';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...refreshableSettings(set),
    ...systemResourcesSettings(set),
  }));
}
