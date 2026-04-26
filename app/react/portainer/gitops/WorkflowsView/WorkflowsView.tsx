import { useMemo } from 'react';

import { PageHeader } from '@@/PageHeader';
import { StatusSummaryBar } from '@@/StatusSummaryBar/StatusSummaryBar';
import {
  SortableList,
  SortableGroup,
  SortOption,
} from '@@/SortableList/SortableList';

import { useWorkflows } from '../queries/useWorkflows';
import { useWorkflowsSummary } from '../queries/useWorkflowsSummary';

import { WorkflowCard } from './WorkflowCard';
import { Workflow, WorkflowStatus } from './types';
import { useListState } from './useListState';

const STATUS_CONFIG: Array<{
  key: WorkflowStatus;
  label: string;
  color: 'error' | 'gray' | 'warning' | 'success';
}> = [
  { key: 'error', label: 'Error', color: 'error' },
  { key: 'paused', label: 'Paused', color: 'gray' },
  { key: 'syncing', label: 'Syncing', color: 'warning' },
  { key: 'healthy', label: 'Healthy', color: 'success' },
  { key: 'unknown', label: 'Unknown', color: 'gray' },
];

const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', grouped: true },
  { key: 'type', label: 'Type', grouped: true },
  { key: 'platform', label: 'Platform', grouped: true },
  { key: 'lastSyncDate', label: 'Last sync' },
];

const GROUP_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  status: STATUS_CONFIG,
  type: [
    { key: 'stack', label: 'Stack' },
    { key: 'edgeStack', label: 'Edge Stack' },
  ],
  platform: [
    { key: 'dockerStandalone', label: 'Docker Standalone' },
    { key: 'dockerSwarm', label: 'Docker Swarm' },
    { key: 'kubernetes', label: 'Kubernetes' },
  ],
};

const GROUP_FIELD: Record<string, (item: Workflow) => string> = {
  status: (item) => item.status,
  type: (item) => item.type,
  platform: (item) => item.platform,
};

export function WorkflowsView() {
  const tableState = useListState();

  const sortBy = tableState.sortBy?.id ?? 'name';

  const workflowsQuery = useWorkflows({
    search: tableState.search || undefined,
    sort: sortBy,
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    start: tableState.page * tableState.pageSize,
    limit: tableState.pageSize,
    status: tableState.status ?? undefined,
    type: tableState.type ?? undefined,
    platform: tableState.platform ?? undefined,
  });

  const summaryQuery = useWorkflowsSummary();

  const page = workflowsQuery.data?.data;
  const totalCount = workflowsQuery.data?.totalCount ?? 0;

  const groups = useMemo(() => buildGroups(page, sortBy), [page, sortBy]);

  const statusSegments = STATUS_CONFIG.map((s) => ({
    ...s,
    count: summaryQuery.data?.[s.key] ?? 0,
  }));

  const groupOptions = useMemo(
    () => ({
      ...GROUP_OPTIONS,
      status: statusSegments,
    }),
    [statusSegments]
  );

  const summaryTotal = summaryQuery.data
    ? Object.values(summaryQuery.data).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <PageHeader
        title="GitOps Workflows"
        breadcrumbs="GitOps Workflows"
        reload
      />
      <div className="mx-4 mb-4 space-y-4">
        <StatusSummaryBar
          total={summaryTotal}
          segments={statusSegments}
          value={tableState.status}
          onChange={tableState.setStatus}
          radioGroupName="workflows-status"
        />
        <SortableList
          tableState={tableState}
          sortOptions={SORT_OPTIONS}
          groupOptions={groupOptions}
          groups={groups}
          totalCount={totalCount}
          isLoading={workflowsQuery.isLoading}
          getItemKey={(item) => item.id}
          showGroupHeaders
          emptyMessage="No workflows found"
          searchPlaceholder="Search"
          renderItem={(item) => <WorkflowCard item={item} />}
          data-cy="workflows-list"
        />
      </div>
    </>
  );
}

function buildGroups(
  items: Workflow[] | null = [],
  sortBy: string
): SortableGroup<Workflow>[] {
  if (!items) {
    return [];
  }

  const options = GROUP_OPTIONS[sortBy];

  if (!options) {
    return items.length > 0 ? [{ key: 'all', label: 'All', items }] : [];
  }

  const getField = GROUP_FIELD[sortBy];
  return options
    .map(({ key, label }) => ({
      key,
      label,
      items: items.filter((item) => getField(item) === key),
    }))
    .filter((g) => g.items.length > 0);
}
