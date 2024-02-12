import { refreshableSettings, createPersistedStore } from '@@/datatables/types';

import { TableSettings } from './DefaultDatatableSettings';
import { systemResourcesSettings } from './SystemResourcesSettings';

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
