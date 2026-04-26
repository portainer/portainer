import { useLocalStorage } from '@/react/hooks/useLocalStorage';
import { useParamsState } from '@/react/hooks/useParamState';

import { BasicTableSettings } from './types';

type CoreUrlState = {
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number | null;
};

type Extra = {
  search: string;
  setSearch(value: string): void;
  page: number;
  setPage(page: number): void;
};

export function useTableStateFromUrl<
  TParsed extends Record<string, unknown> = Record<never, never>,
  TExtra extends Record<string, unknown> = Record<never, never>,
>({
  localStorageKey,
  defaultSort = 'name',
  parseExtra,
  buildExtra,
}: {
  localStorageKey: string;
  defaultSort?: string;
  parseExtra?: (params: Record<string, string | undefined>) => TParsed;
  buildExtra?: (
    urlState: CoreUrlState & TParsed,
    setUrlState: (s: Partial<CoreUrlState & TParsed>) => void
  ) => TExtra;
}): BasicTableSettings & TExtra & Extra {
  const [storedPageSize, setStoredPageSize] = useLocalStorage(
    `datatable_settings_${localStorageKey}_pageSize`,
    10
  );

  const [urlState, setUrlState] = useParamsState((params) => ({
    search: params.search ?? '',
    sort: params.sort ?? defaultSort,
    order: (params.order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
    page: Math.max(0, parseIntOrDefault(params.page, 0)),
    pageSize: parsePositiveIntOrNull(params.pageSize),
    ...(parseExtra ? parseExtra(params) : ({} as TParsed)),
  }));

  const pageSize = urlState.pageSize ?? storedPageSize;

  const extra = buildExtra ? buildExtra(urlState, setUrlState) : ({} as TExtra);

  const tableState = {
    search: urlState.search,
    setSearch: (search: string) => setCoreState({ search, page: 0 }),

    sortBy: { id: urlState.sort, desc: urlState.order === 'desc' },
    setSortBy: (id, desc) =>
      setCoreState({
        sort: id ?? defaultSort,
        order: desc ? 'desc' : 'asc',
        page: 0,
      }),

    page: urlState.page,
    setPage: (page) => setCoreState({ page }),

    pageSize,
    setPageSize: (size) => {
      setStoredPageSize(size);
      setCoreState({ pageSize: size, page: 0 });
    },

    ...extra,
  } satisfies BasicTableSettings & TExtra & Extra;

  return tableState;

  function setCoreState(partial: Partial<CoreUrlState>) {
    return setUrlState(partial as Partial<CoreUrlState & TParsed>);
  }
}

export function parseIntOrDefault<T>(
  raw: string | undefined,
  fallback: T
): number | T {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parsePositiveIntOrNull(raw: string | undefined): number | null {
  const n = parseIntOrDefault(raw, null);
  return n !== null && n > 0 ? n : null;
}

export function asEnum<T>(
  value: string | undefined,
  allowed: Set<T>
): T | null {
  return allowed.has(value as T) ? (value as T) : null;
}
