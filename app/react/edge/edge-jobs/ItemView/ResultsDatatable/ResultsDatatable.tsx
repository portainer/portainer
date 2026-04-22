import { List } from 'lucide-react';

import { queryOptionsFromTableState } from '@/react/common/api/listQueryParams';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { EdgeJob, LogsStatus } from '../../types';
import { useJobResults } from '../../queries/jobResults/useJobResults';

import { columns, sortOptions } from './columns';
import { createStore } from './datatable-store';

const tableKey = 'edge-job-results';
const store = createStore(tableKey);

export function ResultsDatatable({ jobId }: { jobId: EdgeJob['Id'] }) {
  const tableState = useTableState(store, tableKey);

  const jobResultsQuery = useJobResults(jobId, {
    ...queryOptionsFromTableState({ ...tableState }, sortOptions),
    refetchInterval(dataset) {
      const anyCollecting = dataset?.data?.some(
        (r) => r.LogsStatus === LogsStatus.Pending
      );

      if (anyCollecting) {
        return 5000;
      }

      return tableState.autoRefreshRate * 1000;
    },
  });

  const dataset = jobResultsQuery.data?.data || [];

  return (
    <Datatable
      title="Results"
      titleIcon={List}
      columns={columns}
      disableSelect
      dataset={dataset}
      settingsManager={tableState}
      isLoading={jobResultsQuery.isLoading}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'edge-job-results',
          jobId,
        })
      )}
      data-cy="edge-job-results-datatable"
      isServerSidePagination
      page={tableState.page}
      onPageChange={tableState.setPage}
      onSearchChange={() => tableState.setPage(0)}
      totalCount={jobResultsQuery.data?.totalCount || 0}
    />
  );
}
