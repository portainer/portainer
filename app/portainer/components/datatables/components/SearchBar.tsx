import { useContext, createContext, PropsWithChildren } from 'react';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

interface Props {
  autoFocus: boolean;
  value: string;
  onChange(value: string): void;
}

export function SearchBar({ autoFocus, value, onChange }: Props) {
  return (
    <div className="searchBar">
      <i className="fa fa-search searchIcon" aria-hidden="true" />
      <input
        autoFocus={autoFocus}
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
}

export function SearchBarProvider({
  children,
  defaultValue = '',
}: PropsWithChildren<SearchBarProviderProps>) {
  const [value, setValue] = useLocalStorage(
    'datatable_text_filter_containers',
    defaultValue,
    sessionStorage
  );

  return (
    <SearchBarContext.Provider value={[value, setValue]}>
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
