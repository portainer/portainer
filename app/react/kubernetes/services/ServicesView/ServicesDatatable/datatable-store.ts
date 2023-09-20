import { TableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { systemResourcesSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import { refreshableSettings, createPersistedStore } from '@@/datatables/types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...refreshableSettings(set),
    ...systemResourcesSettings(set),
  }));
}
