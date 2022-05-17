import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

import styles from './FilterSearchBar.module.css';

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
    <div className={styles.searchBar}>
      <span className={styles.iconSpan}>
        <i className="fa fa-search" aria-hidden="true" />
      </span>
      <span className={styles.textSpan}>
        <input
          type="text"
          className="searchInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </span>
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
