import { refreshableSettings, createPersistedStore } from '@@/datatables/types';

import { TableSettings } from './types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(
    storageKey,
    'SubmitTime',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
}
