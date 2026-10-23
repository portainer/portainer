import { usePersistedParamsState } from '@/react/hooks/useParamState';

import { BasicTableSettings } from './types';

type CoreUrlState = {
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  groupBy: string | null;
  groupFilter: string | null;
  page: number;
  pageSize: number;
};

type Extra = {
  search: string;
  setSearch(value: string): void;
  page: number;
  setPage(page: number): void;
  groupBy: string | null;
  setGroupBy(group: string | null): void;
  groupFilter: string | null;
  setGroupFilter(value: { group: string; groupValue: string | null }): void;
};

export function useTableStateFromUrl<
  TParsed extends Record<string, unknown> = Record<never, never>,
  TExtra extends Record<string, unknown> = Record<never, never>,
>({
  localStorageKey,
  defaultSort = 'name',
  defaultGroupBy,
  persistedExtraKeys,
  parseExtra,
  buildExtra,
}: {
  localStorageKey: string;
  defaultSort?: string;
  defaultGroupBy?: string;
  persistedExtraKeys?: string[];
  parseExtra?: (params: Record<string, unknown>) => TParsed;
  buildExtra?: (
    urlState: CoreUrlState & TParsed,
    setUrlState: (s: Partial<CoreUrlState & TParsed>) => void
  ) => TExtra;
}): BasicTableSettings & TExtra & Extra {
  const persistedKeys = [
    'sort',
    'order',
    'groupBy',
    'groupFilter',
    'pageSize',
    ...(persistedExtraKeys ?? []),
  ];

  const [urlState, setUrlState] = usePersistedParamsState<
    CoreUrlState & TParsed
  >(
    (params) => ({
      search: typeof params.search === 'string' ? params.search : '',
      sort: typeof params.sort === 'string' ? params.sort : defaultSort,
      order:
        parseOrder(
          typeof params.order === 'string' ? params.order : undefined
        ) ?? 'asc',
      groupBy:
        params.groupBy !== undefined
          ? (params.groupBy as string | null)
          : (defaultGroupBy ?? null),
      groupFilter:
        params.groupFilter !== undefined
          ? (params.groupFilter as string | null)
          : null,
      page: Math.max(
        0,
        typeof params.page === 'number'
          ? params.page
          : parseIntOrDefault(
              typeof params.page === 'string' ? params.page : undefined,
              0
            )
      ),
      pageSize: parsePositiveIntOrNull(params.pageSize) ?? 10,
      ...(parseExtra ? parseExtra(params) : ({} as TParsed)),
    }),
    {
      storageKey: `datatable_${localStorageKey}_state`,
      persistedKeys,
    }
  );

  const extra = buildExtra ? buildExtra(urlState, setUrlState) : ({} as TExtra);

  return {
    search: urlState.search,
    setSearch: (search: string) => setCoreState({ search, page: 0 }),

    sortBy: { id: urlState.sort, desc: urlState.order === 'desc' },
    setSortBy: (id, desc) =>
      setCoreState({
        sort: id ?? defaultSort,
        groupBy: null,
        groupFilter: null,
        order: desc ? 'desc' : 'asc',
        page: 0,
      }),

    groupBy: urlState.groupBy,
    setGroupBy: (group) =>
      setCoreState({
        groupBy: group,
        groupFilter: null,
        page: 0,
      }),

    groupFilter: urlState.groupFilter,
    setGroupFilter: ({
      group,
      groupValue,
    }: {
      group: string;
      groupValue: string | null;
    }) => {
      const isSameGroup = urlState.groupBy === group;
      setCoreState({
        sort: group,
        order: isSameGroup && urlState.order === 'asc' ? 'desc' : 'asc',
        groupBy: group,
        groupFilter: groupValue,
        page: 0,
      });
    },

    page: urlState.page,
    setPage: (page) => setCoreState({ page }),

    pageSize: urlState.pageSize,
    setPageSize: (size) => {
      setCoreState({ pageSize: size, page: 0 });
    },

    ...extra,
  } satisfies BasicTableSettings & TExtra & Extra;

  function setCoreState(partial: Partial<CoreUrlState>) {
    setUrlState(partial as Partial<CoreUrlState & TParsed>);
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

export function parsePositiveIntOrNull(raw: unknown): number | null {
  if (typeof raw === 'number') return raw > 0 ? Math.floor(raw) : null;
  const n = parseIntOrDefault(typeof raw === 'string' ? raw : undefined, null);
  return n !== null && n > 0 ? n : null;
}

export function asEnum<T>(value: unknown, allowed: Set<T>): T | null {
  return allowed.has(value as T) ? (value as T) : null;
}

function parseOrder(raw: string | undefined): 'asc' | 'desc' | null {
  return raw === 'asc' || raw === 'desc' ? raw : null;
}
