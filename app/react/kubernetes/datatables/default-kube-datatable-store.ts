import { useState } from 'react';

import {
  refreshableSettings,
  createPersistedStore,
  ZustandSetFunc,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { TableSettings } from './DefaultDatatableSettings';
import { systemResourcesSettings } from './SystemResourcesSettings';

export function createStore<T extends TableSettings>(
  storageKey: string,
  initialSortBy?: string | { id: string; desc: boolean },
  create: (set: ZustandSetFunc<T>) => Omit<T, keyof TableSettings> = () =>
    ({}) as T
) {
  return createPersistedStore<T>(
    storageKey,
    initialSortBy,
    (set) =>
      ({
        ...refreshableSettings(set),
        ...systemResourcesSettings(set),
        ...create(set),
      }) as T
  );
}

export function useKubeStore<T extends TableSettings>(
  ...args: Parameters<typeof createStore<T>>
) {
  const [store] = useState(() => createStore(...args));
  return useTableState(store, args[0]);
}
