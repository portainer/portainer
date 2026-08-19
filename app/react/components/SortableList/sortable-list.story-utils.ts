import { useMemo, ReactNode } from 'react';

import { DropdownOption } from '../DropdownMenu/DropdownMenu';

import { SortableGroup, SortableListState } from './SortableList';

export function useGroupOptions<T>(
  sortBy: string,
  items: T[],
  getGroupKeys: (sortBy: string) => string[],
  getGroupKey: (item: T, sortBy: string) => string,
  getGroupLabel: (sortBy: string, key: string) => string
): DropdownOption[] {
  return useMemo(() => {
    const groupKeys = getGroupKeys(sortBy);
    function key(item: T) {
      return getGroupKey(item, sortBy);
    }
    return buildGroupFilterOptions(items, groupKeys, key, (k) =>
      getGroupLabel(sortBy, k)
    );
  }, [getGroupKey, getGroupKeys, getGroupLabel, items, sortBy]);
}

export interface ComputePagedGroupsParams<T> {
  items: T[];
  sortBy: string;
  page: number;
  pageSize: number;
  groupFilter: string | null;
  search: string;
  getGroupKeys: (sortBy: string) => string[];
  getGroupKey: (item: T, sortBy: string) => string;
  getGroupLabel: (sortBy: string, key: string) => string;
  getSearchText: (item: T) => string;
  getGroupIcon?: (key: string) => ReactNode;
}

export function computePagedGroups<T>({
  items,
  sortBy,
  page,
  pageSize,
  groupFilter,
  search,
  getGroupKeys,
  getGroupKey,
  getGroupLabel,
  getSearchText,
  getGroupIcon,
}: ComputePagedGroupsParams<T>): {
  groups: SortableGroup<T>[];
  totalCount: number;
} {
  const groupKeys = getGroupKeys(sortBy);

  const filtered = filterByGroupAndSearch(
    items,
    groupFilter,
    key,
    search,
    getSearchText
  );
  const sorted = sortItemsByGroup(filtered, groupKeys, key);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  return {
    groups: buildSortableGroups(
      paginated,
      groupKeys,
      key,
      (k) => getGroupLabel(sortBy, k),
      getGroupIcon
    ),
    totalCount: filtered.length,
  };

  function key(item: T) {
    return getGroupKey(item, sortBy);
  }
}

export function useGroups<T>(
  tableState: SortableListState,
  items: T[],
  defaultSortKey: string,
  getGroupKeys: (sortBy: string) => string[],
  getGroupKey: (item: T, sortBy: string) => string,
  getGroupLabel: (sortBy: string, key: string) => string,
  getSearchText: (item: T) => string,
  getGroupIcon?: (key: string) => ReactNode
): { groups: SortableGroup<T>[]; totalCount: number } {
  const sortBy = tableState.groupBy ?? tableState.sortBy?.id ?? defaultSortKey;
  return useMemo(
    () =>
      computePagedGroups({
        items,
        sortBy,
        page: tableState.page,
        pageSize: tableState.pageSize,
        groupFilter: tableState.groupFilter,
        search: tableState.search,
        getGroupKeys,
        getGroupKey,
        getGroupLabel,
        getSearchText,
        getGroupIcon,
      }),
    [
      getGroupKeys,
      sortBy,
      items,
      tableState.groupFilter,
      tableState.search,
      tableState.page,
      tableState.pageSize,
      getSearchText,
      getGroupIcon,
      getGroupKey,
      getGroupLabel,
    ]
  );
}

function filterByGroupAndSearch<T>(
  items: T[],
  groupFilter: string | null,
  getGroupKey: (item: T) => string,
  search: string,
  getSearchText: (item: T) => string
): T[] {
  const q = search.toLowerCase().trim();
  return items.filter((item) => {
    if (groupFilter && getGroupKey(item) !== groupFilter) return false;
    if (q) return getSearchText(item).toLowerCase().includes(q);
    return true;
  });
}

function buildGroupFilterOptions<T>(
  allItems: T[],
  groupKeys: string[],
  getGroupKey: (item: T) => string,
  getLabel: (key: string) => string
): DropdownOption[] {
  return groupKeys.map((k) => ({
    key: k,
    label: getLabel(k),
    count: allItems.filter((item) => getGroupKey(item) === k).length,
  }));
}

function sortItemsByGroup<T>(
  items: T[],
  groupKeys: string[],
  getGroupKey: (item: T) => string
): T[] {
  if (groupKeys.length === 0) return items;
  return [...items].sort(
    (a, b) =>
      groupKeys.indexOf(getGroupKey(a)) - groupKeys.indexOf(getGroupKey(b))
  );
}

function buildSortableGroups<T>(
  paginated: T[],
  groupKeys: string[],
  getGroupKey: (item: T) => string,
  getLabel: (key: string) => string,
  getIcon?: (key: string) => ReactNode
): SortableGroup<T>[] {
  if (groupKeys.length === 0) {
    return paginated.length > 0
      ? [{ key: 'all', label: 'All', items: paginated }]
      : [];
  }
  return groupKeys
    .map((k) => ({
      key: k,
      label: getLabel(k),
      icon: getIcon?.(k),
      items: paginated.filter((item) => getGroupKey(item) === k),
    }))
    .filter((g) => g.items.length > 0);
}
