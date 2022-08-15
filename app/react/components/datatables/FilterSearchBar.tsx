import { Search } from 'react-feather';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

interface Props {
  value: string;
  placeholder?: string;
  onChange(value: string): void;
}

export function FilterSearchBar({
  value,
  placeholder = 'Search...',
  onChange,
}: Props) {
  return (
    <div className="searchBar items-center flex h-[34px]">
      <Search className="searchIcon feather" />
      <input
        type="text"
        className="searchInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-cy="home-environmentSearch"
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
