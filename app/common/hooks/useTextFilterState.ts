import { useLocalStorage } from './useLocalStorage';

export function useTextFilterState(key: string): [string, (value: string) => void] {
  const filterKey = paginationKeyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '', sessionStorage);

  return [value, setValue];

  function paginationKeyBuilder(key: string) {
    return `datatable_text_filter_${key}`;
  }
}
