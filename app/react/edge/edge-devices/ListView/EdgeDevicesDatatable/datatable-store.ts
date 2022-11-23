import {
  refreshableSettings,
  hiddenColumnsSettings,
  createPersistedStore,
} from '@@/datatables/types';

import { TableSettings } from './types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'Name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...refreshableSettings(set),
  }));
}
