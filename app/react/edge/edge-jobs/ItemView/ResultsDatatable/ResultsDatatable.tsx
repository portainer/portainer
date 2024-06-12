import { List } from 'lucide-react';
import { useMemo } from 'react';

import { Environment } from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { EdgeJob, JobResult, LogsStatus } from '../../types';
import { useJobResults } from '../../queries/jobResults/useJobResults';

import { columns } from './columns';
import { createStore } from './datatable-store';

const tableKey = 'edge-job-results';
const store = createStore(tableKey);

export function ResultsDatatable({ jobId }: { jobId: EdgeJob['Id'] }) {
  const tableState = useTableState(store, tableKey);

  const jobResultsQuery = useJobResults(jobId, {
    refetchInterval(dataset) {
      const anyCollecting = dataset?.some(
        (r) => r.LogsStatus === LogsStatus.Pending
      );

      if (anyCollecting) {
        return 5000;
      }

      return tableState.autoRefreshRate * 1000;
    },
  });

  const environmentIds = jobResultsQuery.data?.map(
    (result) => result.EndpointId
  );

  const environmentsQuery = useEnvironmentList(
    { endpointIds: environmentIds },
    { enabled: !!environmentIds && !jobResultsQuery.isLoading }
  );

  const dataset = useMemo(
    () =>
      jobResultsQuery.isLoading || environmentsQuery.isLoading
        ? []
        : associateEndpointsToResults(
            jobResultsQuery.data || [],
            environmentsQuery.environments
          ),
    [
      environmentsQuery.environments,
      environmentsQuery.isLoading,
      jobResultsQuery.data,
      jobResultsQuery.isLoading,
    ]
  );

  return (
    <Datatable
      disableSelect
      columns={columns}
      dataset={dataset}
      isLoading={jobResultsQuery.isLoading || environmentsQuery.isLoading}
      title="Results"
      titleIcon={List}
      settingsManager={tableState}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'edge-job-results',
          jobId,
        })
      )}
      data-cy="edge-job-results-datatable"
    />
  );
}

function associateEndpointsToResults(
  results: Array<JobResult>,
  environments: Array<Environment>
) {
  return results.map((result) => {
    const environment = environments.find(
      (environment) => environment.Id === result.EndpointId
    );
    return {
      ...result,
      Endpoint: environment,
    };
  });
}
