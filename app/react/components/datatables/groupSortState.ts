interface DimensionConfig {
  key: string;
}

type UrlState = { sort: string; order: 'asc' | 'desc' } & Record<
  string,
  unknown
>;
type SetUrlState = (update: Record<string, unknown>) => void;

interface GroupSortConfig {
  urlState: UrlState;
  setUrlState: SetUrlState;
  defaultSort: string;
  sortKeys: readonly string[];
  dimensions: DimensionConfig[];
}

export function buildGroupSortExtras({
  urlState,
  setUrlState,
  defaultSort,
  sortKeys,
  dimensions,
}: GroupSortConfig) {
  const sortKey = toSortKey(urlState.sort, sortKeys, defaultSort);

  return {
    groupFilter: dimensions.some((d) => d.key === sortKey)
      ? (urlState[sortKey] as string | null)
      : null,

    setGroupFilter: ({
      group,
      groupValue,
    }: {
      group: string;
      groupValue: string | null;
    }) => {
      const newKey = toSortKey(group, sortKeys, defaultSort);
      const currentKey = toSortKey(urlState.sort, sortKeys, defaultSort);
      const isLeavingDimension =
        currentKey !== newKey && dimensions.some((d) => d.key === currentKey);
      setUrlState({
        sort: newKey,
        order: newOrder(sortKey, newKey, urlState.order, groupValue),
        page: 0,
        groupBy: null,
        groupFilter: null,
        [newKey]: groupValue,
        ...(isLeavingDimension ? { [currentKey]: null } : {}),
      });
    },

    setSortBy: (id: string, desc: boolean) => {
      const newKey = toSortKey(id ?? defaultSort, sortKeys, defaultSort);
      const currentKey = toSortKey(urlState.sort, sortKeys, defaultSort);
      const dimsToClear =
        newKey !== currentKey
          ? dimensions.filter((d) => d.key === newKey || d.key === currentKey)
          : [];
      setUrlState({
        sort: newKey,
        order: desc ? 'desc' : 'asc',
        page: 0,
        groupBy: null,
        groupFilter: null,
        ...Object.fromEntries(dimsToClear.map((d) => [d.key, null])),
      });
    },
  };
}

function toSortKey(
  sort: string,
  sortKeys: readonly string[],
  defaultSort: string
): string {
  return sortKeys.includes(sort) ? sort : defaultSort;
}

function newOrder(
  currentSortKey: string,
  newSortKey: string,
  currentOrder: 'asc' | 'desc',
  groupValue: string | null = null
): 'asc' | 'desc' {
  if (currentSortKey !== newSortKey) {
    return 'asc';
  }

  // Only toggle sort order when clearing the group filter (groupValue is null)
  if (groupValue !== null) {
    return currentOrder;
  }

  return currentOrder === 'asc' ? 'desc' : 'asc';
}
