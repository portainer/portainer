import { useState } from 'react';

import { TableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';

import {
  refreshableSettings,
  createPersistedStore,
  ZustandSetFunc,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';

interface NamespaceSelectSettings {
  namespace: string;
  setNamespace: (namespace: string) => void;
}
export type ApplicationsTableSettings = NamespaceSelectSettings & TableSettings;

export function namespaceSelectSettings<T extends NamespaceSelectSettings>(
  set: ZustandSetFunc<T>,
  namespace = 'default'
): NamespaceSelectSettings {
  return {
    namespace,
    setNamespace: (namespace: string) => set((s) => ({ ...s, namespace })),
  };
}

export function createStore<T extends ApplicationsTableSettings>(
  storageKey: string,
  initialSortBy?: string | { id: string; desc: boolean },
  create: (
    set: ZustandSetFunc<T>
  ) => Omit<T, keyof ApplicationsTableSettings> = () => ({}) as T
) {
  return createPersistedStore<T>(
    storageKey,
    initialSortBy,
    (set) =>
      ({
        ...refreshableSettings(set),
        ...systemResourcesSettings(set),
        ...namespaceSelectSettings(set),
        ...create(set),
      }) as T
  );
}

export function useKubeAppsTableStore<T extends ApplicationsTableSettings>(
  ...args: Parameters<typeof createStore<T>>
) {
  const [store] = useState(() => createStore(...args));
  return useTableState(store, args[0]);
}
