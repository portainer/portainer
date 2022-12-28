import { ComponentType } from 'react';
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

export interface StoreProps<T extends BasicTableSettings> {
  settings: T;

  searchValue: string;
  onSearch: (value: string) => void;
}

export function withDatatableStore<
  TProps,
  TSettings extends BasicTableSettings = BasicTableSettings
>(
  WrappedComponent: ComponentType<TProps & StoreProps<TSettings>>,
  storageKey: string,
  createStore: (
    tableKey: string
  ) => ReturnType<Wrapper<TSettings>['wrapped']> = createPersistedStore
): ComponentType<TProps> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const store = createStore(storageKey);

  function WrapperComponent(props: TProps) {
    const settings = useStore(store);
    const [searchValue, setSearchValue] = useSearchBarState(storageKey);

    return (
      <WrappedComponent
        {...props}
        settings={settings}
        searchValue={searchValue}
        onSearch={setSearchValue}
      />
    );
  }

  WrapperComponent.displayName = `withDatatableStore(${displayName})`;

  return WrapperComponent;
}
