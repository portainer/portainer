import { useState } from 'react';

import { PageHeader } from '@@/PageHeader';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { BEOverlay } from '@@/BEFeatureIndicator/BEOverlay';

import { FeatureId } from '../../feature-flags/enums';

import { ActivityLogsTable } from './ActivityLogsTable';
import { useActivityLogs, getSortType } from './useActivityLogs';
import { useExportMutation } from './useExportMutation';
import { FilterBar } from './FilterBar';

export function ActivityLogsView() {
  const exportMutation = useExportMutation();
  const [range, setRange] = useState<
    { start: Date; end: Date | null } | undefined
  >(undefined);
  const [page, setPage] = useState(0);
  const tableState = useTableStateWithoutStorage('Timestamp', true);
  const offset = page * tableState.pageSize;

  const query = {
    offset,
    limit: tableState.pageSize,
    sortBy: getSortType(tableState.sortBy?.id),
    sortDesc: tableState.sortBy?.desc,
    search: tableState.search,
    ...(range
      ? {
          after: seconds(range?.start?.valueOf()),
          before: seconds(range?.end?.valueOf()),
        }
      : undefined),
  };

  const logsQuery = useActivityLogs(query);

  return (
    <>
      <PageHeader
        title="User activity logs"
        breadcrumbs="User activity logs"
        reload
      />

      <div className="mx-4">
        <BEOverlay variant="multi-widget" featureId={FeatureId.ACTIVITY_AUDIT}>
          <div className="row">
            <div className="col-sm-12">
              <FilterBar
                value={range}
                onChange={setRange}
                onExport={handleExport}
              />
            </div>
          </div>
          <ActivityLogsTable
            sort={tableState.sortBy}
            onChangeSort={(value) =>
              tableState.setSortBy(value?.id, value?.desc || false)
            }
            limit={tableState.pageSize}
            onChangeLimit={tableState.setPageSize}
            keyword={tableState.search}
            onChangeKeyword={tableState.setSearch}
            currentPage={page}
            onChangePage={setPage}
            totalItems={logsQuery.data?.totalCount || 0}
            dataset={logsQuery.data?.logs}
          />
        </BEOverlay>
      </div>
    </>
  );

  function handleExport() {
    exportMutation.mutate(query);
  }
}

function seconds(ms?: number) {
  if (!ms) {
    return undefined;
  }

  return Math.floor(ms / 1000);
}
