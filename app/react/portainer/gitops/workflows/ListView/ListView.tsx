import { useMemo } from 'react';

import { PageHeader } from '@@/PageHeader';
import { StatusSummaryBar } from '@@/StatusSummaryBar/StatusSummaryBar';
import {
  SortableList,
  SortableGroup,
  SortOption,
} from '@@/SortableList/SortableList';
import { asEnum } from '@@/datatables/useTableStateFromUrl';

import { useWorkflows } from '../queries/useWorkflows';
import { useWorkflowsSummary } from '../../queries/useWorkflowsSummary';
import { Workflow, WorkflowStatus } from '../types';
import { effectiveWorkflowStatus } from '../status';

import { WorkflowCard } from './WorkflowCard';
import { useListState, SORT_KEYS } from './useListState';

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
  { key: 'lastSyncDate', label: 'Last sync' },
];

const SORT_KEY_SET = new Set(SORT_KEYS);

const GROUP_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  status: STATUS_CONFIG,
};

const GROUP_FIELD: Record<string, (item: Workflow) => string> = {
  status: (item) => effectiveWorkflowStatus(item).status,
};

export function ListView() {
  const tableState = useListState();

  const sortBy = tableState.sortBy?.id ?? 'name';

  const workflowsQuery = useWorkflows({
    search: tableState.search || undefined,
    sort: asEnum(sortBy, SORT_KEY_SET) ?? 'name',
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    start: tableState.page * tableState.pageSize,
    limit: tableState.pageSize,
    status: tableState.status ?? undefined,
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
          isLoading={summaryQuery.isLoading}
        />
        <SortableList
          tableState={tableState}
          sortOptions={SORT_OPTIONS}
          groupOptions={groupOptions}
          groups={groups}
          totalCount={totalCount}
          isLoading={workflowsQuery.isLoading}
          getItemKey={(item) => `workflow-${item.id}`}
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
