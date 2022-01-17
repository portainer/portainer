import { useContext, createContext, PropsWithChildren } from 'react';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

interface Props {
  value: string;
  onChange(value: string): void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="searchBar">
      <i className="fa fa-search searchIcon" aria-hidden="true" />
      <input
        type="text"
        className="searchInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
      />
    </div>
  );
}

const SearchBarContext = createContext<
  [string, (value: string) => void] | null
>(null);

interface SearchBarProviderProps {
  defaultValue?: string;
  storageKey: string;
}

export function SearchBarProvider({
  children,
  storageKey,
  defaultValue = '',
}: PropsWithChildren<SearchBarProviderProps>) {
  const state = useLocalStorage(
    `datatable_text_filter_${storageKey}`,
    defaultValue,
    sessionStorage
  );

  return (
    <SearchBarContext.Provider value={state}>
      {children}
    </SearchBarContext.Provider>
  );
}

export function useSearchBarContext() {
  const context = useContext(SearchBarContext);
  if (context === null) {
    throw new Error('should be used under SearchBarProvider');
  }

  return context;
}
