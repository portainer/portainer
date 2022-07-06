import { Search } from 'react-feather';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { AutomationTestingProps } from '@/types';

interface Props extends AutomationTestingProps {
  value: string;
  placeholder?: string;
  onChange(value: string): void;
}

export function SearchBar({
  value,
  placeholder = 'Search...',
  onChange,
  'data-cy': dataCy,
}: Props) {
  return (
    <div className="searchBar items-center flex">
      <Search className="searchIcon feather" />
      <input
        type="text"
        className="searchInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-cy={dataCy}
      />
    </div>
  );
}

export function useSearchBarState(
  key: string
): [string, (value: string) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '', sessionStorage);

  return [value, setValue];

  function keyBuilder(key: string) {
    return `datatable_text_filter_${key}`;
  }
}
