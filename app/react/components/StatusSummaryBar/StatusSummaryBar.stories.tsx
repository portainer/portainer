import { useState } from 'react';
import { Meta } from '@storybook/react-webpack5';

import { StatusSummaryBar, StatusSegment } from './StatusSummaryBar';

export default {
  component: StatusSummaryBar,
  title: 'Design System/StatusSummaryBar',
} as Meta;

const environmentSegments: StatusSegment[] = [
  { key: 'up', label: 'Up', count: 12, color: 'success' },
  { key: 'down', label: 'Down', count: 3, color: 'error' },
  { key: 'outdated', label: 'Outdated', count: 2, color: 'warning' },
  { key: 'unassigned', label: 'Unassigned', count: 5, color: 'gray' },
];

export function Environments() {
  const [filter, setFilter] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <StatusSummaryBar
        total={22}
        segments={environmentSegments}
        value={filter}
        onChange={setFilter}
        data-cy="environment-status-bar"
        ariaLabel="Filter by environment status"
      />
      <div className="rounded-lg border border-solid border-gray-4 p-4 text-sm">
        Active filter: <strong>{filter}</strong>
      </div>
    </div>
  );
}

const containerSegments: StatusSegment[] = [
  { key: 'running', label: 'Running', count: 45, color: 'success' },
  { key: 'stopped', label: 'Stopped', count: 8, color: 'error' },
  { key: 'healthy', label: 'Healthy', count: 40, color: 'blue' },
  { key: 'unhealthy', label: 'Unhealthy', count: 5, color: 'warning' },
];

export function Containers() {
  const [filter, setFilter] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <StatusSummaryBar
        total={53}
        segments={containerSegments}
        value={filter}
        onChange={setFilter}
        data-cy="container-status-bar"
        ariaLabel="Filter by container status"
      />
      <div className="rounded-lg border border-solid border-gray-4 p-4 text-sm">
        Active filter: <strong>{filter}</strong>
      </div>
    </div>
  );
}

export function WithZeroCounts() {
  const [filter, setFilter] = useState<string | null>(null);

  const segments: StatusSegment[] = [
    { key: 'up', label: 'Up', count: 5, color: 'success' },
    { key: 'down', label: 'Down', count: 0, color: 'error' },
    { key: 'outdated', label: 'Outdated', count: 0, color: 'warning' },
  ];

  return (
    <StatusSummaryBar
      total={5}
      segments={segments}
      value={filter}
      onChange={setFilter}
      ariaLabel="Filter with zero counts"
    />
  );
}
