import { useLocalStorage } from './useLocalStorage';

export function usePaginationLimitState(
  key: string
): [number, (value: number) => void] {
  const paginationKey = paginationKeyBuilder(key);
  const [pageLimit, setPageLimit] = useLocalStorage(paginationKey, 10);

  return [pageLimit, setPageLimit];

  function paginationKeyBuilder(key: string) {
    return `datatable_pagination_${key}`;
  }
}
