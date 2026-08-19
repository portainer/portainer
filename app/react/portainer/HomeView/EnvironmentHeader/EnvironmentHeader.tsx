import { useEnvironmentSummaryCounts } from '@/react/portainer/environments/queries/useEnvironmentSummaryCounts';
import { SortType } from '@/react/portainer/environments/queries/useEnvironmentList';

import {
  StatusSummaryBar,
  StatusSegment,
} from '@@/StatusSummaryBar/StatusSummaryBar';

import { useHomeViewState } from '../useHomeViewState';

type HeaderFilter =
  | 'all'
  | 'custom'
  | 'up'
  | 'down'
  | 'outdated'
  | 'unassigned';

type ActionableFilter = Exclude<HeaderFilter, 'all' | 'custom'>;

const HEADER_FILTER_CONFIG: Record<
  ActionableFilter,
  { sortBy: SortType; groupFilter: string }
> = {
  up: { sortBy: 'Health', groupFilter: 'Up' },
  down: { sortBy: 'Health', groupFilter: 'Down' },
  outdated: { sortBy: 'Health', groupFilter: 'Outdated' },
  unassigned: { sortBy: 'Group', groupFilter: '1' },
};

function deriveHeaderFilter(
  sortKey: string | undefined,
  sortGroupFilter: string | null
): HeaderFilter {
  if (!sortKey) return 'custom';
  if (!sortGroupFilter) return 'all';
  const entries = Object.entries(HEADER_FILTER_CONFIG) as [
    ActionableFilter,
    { sortBy: string; groupFilter: string },
  ][];
  const match = entries.find(
    ([, c]) => c.sortBy === sortKey && c.groupFilter === sortGroupFilter
  );
  return match?.[0] ?? 'custom';
}

export function EnvironmentHeader() {
  const countsQuery = useEnvironmentSummaryCounts();
  const counts = countsQuery.data;
  const tableState = useHomeViewState();
  const headerFilter = deriveHeaderFilter(
    tableState.groupKey,
    tableState.groupFilter
  );

  function handleFilterChange(f: string | null) {
    if (f === null) {
      tableState.setHeaderFilter('Id' as SortType, null);
      return;
    }
    const config = HEADER_FILTER_CONFIG[f as ActionableFilter];
    tableState.setHeaderFilter(config.sortBy, config.groupFilter);
  }

  if (countsQuery.isLoading || !counts || counts.total === 0) {
    return null;
  }
  const segments: StatusSegment[] = [
    { key: 'up', label: 'Up', count: counts.up, color: 'success' },
    { key: 'down', label: 'Down', count: counts.down, color: 'error' },
    {
      key: 'outdated',
      label: 'Outdated',
      count: counts.outdated,
      color: 'warning',
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      count: counts.unassigned,
      color: 'gray',
    },
  ];

  return (
    <StatusSummaryBar
      total={counts.total}
      segments={segments}
      value={headerFilter}
      onChange={handleFilterChange}
      radioGroupName="environment-status-filter"
      data-cy="environment-status-bar"
      ariaLabel="Filter by environment status"
    />
  );
}
