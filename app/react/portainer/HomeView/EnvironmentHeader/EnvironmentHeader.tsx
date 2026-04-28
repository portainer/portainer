import { useEnvironmentSummaryCounts } from '@/react/portainer/environments/queries/useEnvironmentSummaryCounts';

import {
  StatusSummaryBar,
  StatusSegment,
} from '@@/StatusSummaryBar/StatusSummaryBar';

export type HeaderFilter =
  | 'all'
  | 'custom'
  | 'up'
  | 'down'
  | 'outdated'
  | 'unassigned';

interface Props {
  activeFilter: HeaderFilter;
  onFilterChange: (filter: HeaderFilter) => void;
}

export function EnvironmentHeader({ activeFilter, onFilterChange }: Props) {
  const countsQuery = useEnvironmentSummaryCounts();
  const counts = countsQuery.data;

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
      value={activeFilter === 'all' ? null : activeFilter}
      onChange={(f) => onFilterChange((f ?? 'all') as HeaderFilter)}
      radioGroupName="environment-status-filter"
      data-cy="environment-status-bar"
      ariaLabel="Filter by environment status"
    />
  );
}
