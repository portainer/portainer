import { useMemo } from 'react';
import { useStore } from 'zustand';

import { useSearchBarState } from './SearchBar';
import { BasicTableSettings, createPersistedStore } from './types';

/** this class is just a dummy class to get return type of createPersistedStore
 * can be fixed after upgrade to ts 4.7+
 * https://stackoverflow.com/a/64919133
 */
class Wrapper<T extends BasicTableSettings> {
  // eslint-disable-next-line class-methods-use-this
  wrapped() {
    return createPersistedStore<T>('', '');
  }
}

export function useTableState<
  TSettings extends BasicTableSettings = BasicTableSettings
>(store: ReturnType<Wrapper<TSettings>['wrapped']>, storageKey: string) {
  const settings = useStore(store);

  const [search, setSearch] = useSearchBarState(storageKey);

  return useMemo(
    () => ({ ...settings, setSearch, search }),
    [settings, search, setSearch]
  );
}
