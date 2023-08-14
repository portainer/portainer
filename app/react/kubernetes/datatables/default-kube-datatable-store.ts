import { refreshableSettings, createPersistedStore } from '@@/datatables/types';

import {
  systemResourcesSettings,
  TableSettings,
} from './DefaultDatatableSettings';

export function createStore(
  storageKey: string,
  initialSortBy: string | { id: string; desc: boolean } = 'name'
) {
  return createPersistedStore<TableSettings>(
    storageKey,
    initialSortBy,
    (set) => ({
      ...refreshableSettings(set),
      ...systemResourcesSettings(set),
    })
  );
}
