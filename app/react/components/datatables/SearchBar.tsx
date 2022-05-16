import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

interface Props {
  value: string;
  placeholder?: string;
  onChange(value: string): void;
}

export function SearchBar({
  value,
  placeholder = 'Search...',
  onChange,
}: Props) {
  return (
    <div className="searchBar">
      <i className="fa fa-search searchIcon" aria-hidden="true" />
      <input
        type="text"
        className="searchInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
