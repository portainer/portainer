import { Search } from 'react-feather';

import { useLocalStorage } from '@/react/hooks/useLocalStorage';
import { AutomationTestingProps } from '@/types';
import { useDebounce } from '@/react/hooks/useDebounce';

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
  const [searchValue, setSearchValue] = useDebounce(value, onChange);

  return (
    <div className="searchBar items-center flex min-w-[90px]">
      <Search className="searchIcon feather shrink-0" />
      <input
        type="text"
        className="searchInput"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
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
