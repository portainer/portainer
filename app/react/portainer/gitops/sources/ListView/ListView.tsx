import { PageHeader } from '@@/PageHeader';
import {
  SortableGroup,
  SortableList,
  SortOption,
} from '@@/SortableList/SortableList';
import { StatusSummaryBar } from '@@/StatusSummaryBar/StatusSummaryBar';
import { AddButton } from '@@/buttons';

import { useSources } from '../queries/useSources';
import { useSourcesSummary } from '../queries/useSourcesSummary';
import { Source, SourceStatus, SOURCE_TYPES } from '../types';

import { SourceCard } from './SourceCard';
import { useListState } from './useListState';

const STATUS_CONFIG: Array<{
  key: SourceStatus;
  label: string;
  color: 'error' | 'gray' | 'warning' | 'success';
}> = [
  { key: 'error', label: 'Error', color: 'error' },
  { key: 'paused', label: 'Paused', color: 'gray' },
  { key: 'syncing', label: 'Syncing', color: 'warning' },
  { key: 'healthy', label: 'Healthy', color: 'success' },
  { key: 'unknown', label: 'Unknown', color: 'gray' },
];

const TYPE_CONFIG = Object.entries(SOURCE_TYPES).map(([key, { label }]) => ({
  key,
  label,
}));

const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', grouped: true },
  { key: 'type', label: 'Type', grouped: true },
];

const GROUP_OPTIONS = {
  status: STATUS_CONFIG,
  type: TYPE_CONFIG,
};

export function ListView() {
  const tableState = useListState();
  const sortBy = tableState.sortBy?.id ?? 'name';

  const sourcesQuery = useSources({
    search: tableState.search || undefined,
    sort: sortBy,
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    start: tableState.page * tableState.pageSize,
    limit: tableState.pageSize,
    status: tableState.status ?? undefined,
    type: tableState.type ?? undefined,
  });

  const summaryQuery = useSourcesSummary();

  const page = sourcesQuery.data?.data;
  const totalCount = sourcesQuery.data?.totalCount ?? 0;
  const groups = buildGroups(page, sortBy);

  const statusSegments = STATUS_CONFIG.map((s) => ({
    ...s,
    count: summaryQuery.data?.[s.key] ?? 0,
  }));

  const summaryTotal = summaryQuery.data
    ? Object.values(summaryQuery.data).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <PageHeader title="GitOps Sources" breadcrumbs="GitOps Sources" reload>
        <div className="ml-auto">
          <AddButton data-cy="add-source-button">Add new</AddButton>
        </div>
      </PageHeader>
      <div className="mx-4 mb-4 space-y-4">
        <StatusSummaryBar
          total={summaryTotal}
          segments={statusSegments}
          value={tableState.status}
          onChange={tableState.setStatus}
          radioGroupName="sources-status"
          isLoading={summaryQuery.isLoading}
        />
        <SortableList
          tableState={tableState}
          sortOptions={SORT_OPTIONS}
          groupOptions={{ ...GROUP_OPTIONS, status: statusSegments }}
          groups={groups}
          totalCount={totalCount}
          isLoading={sourcesQuery.isLoading}
          getItemKey={(item) => item.id}
          showGroupHeaders
          emptyMessage="No sources found"
          searchPlaceholder="Search"
          renderItem={(item) => <SourceCard item={item} />}
          data-cy="sources-list"
        />
      </div>
    </>
  );
}

function buildGroups(
  items: Source[] | null | undefined,
  sortBy: string
): SortableGroup<Source>[] {
  if (!items?.length) {
    return [];
  }

  if (sortBy === 'status') {
    return STATUS_CONFIG.map(({ key, label }) => ({
      key,
      label,
      items: items.filter((item) => item.status === key),
    })).filter((g) => g.items.length > 0);
  }

  if (sortBy === 'type') {
    return TYPE_CONFIG.map(({ key, label }) => ({
      key,
      label,
      items: items.filter((item) => item.type === key),
    })).filter((g) => g.items.length > 0);
  }

  return [{ key: 'all', label: 'All', items }];
}
