import { useMemo } from 'react';
import { Trash2, CalendarCheck2 } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import {
  DefaultDatatableSettings,
  TableSettings as KubeTableSettings,
} from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { LoadingButton } from '@@/buttons';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import { useJobs } from './queries/useJobs';
import { columns } from './columns';
import { Job } from './types';
import { useDeleteJobsMutation } from './queries/useDeleteJobsMutation';

const storageKey = 'jobs';

interface TableSettings
  extends KubeTableSettings, FilteredColumnsTableSettings {}

export function JobsDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );

  const jobsQuery = useJobs(environmentId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
  });
  const jobsRowData = jobsQuery.data;

  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );
  const filteredJobs = useMemo(
    () =>
      tableState.showSystemResources
        ? jobsRowData
        : jobsRowData?.filter(
            (job) =>
              // show everything if we can access system resources and the table is set to show them
              (canAccessSystemResources && tableState.showSystemResources) ||
              // otherwise, only show non-system resources
              !job.IsSystem
          ),
    [jobsRowData, tableState.showSystemResources, canAccessSystemResources]
  );

  return (
    <Datatable
      dataset={filteredJobs || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={jobsQuery.isLoading}
      title="Jobs"
      titleIcon={CalendarCheck2}
      getRowId={(row) => row.Id}
      isRowSelectable={(row) => !row.original.IsSystem}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
      data-cy="k8s-jobs-datatable"
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
    />
  );
}

interface SelectedJob {
  Namespace: string;
  Name: string;
}

type TableActionsProps = {
  selectedItems: Job[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteJobsMutation = useDeleteJobsMutation(environmentId);
  const router = useRouter();

  return (
    <Authorized authorizations="K8sCronJobsW">
      <LoadingButton
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemoveClick(selectedItems)}
        icon={Trash2}
        isLoading={deleteJobsMutation.isLoading}
        loadingText="Removing jobs..."
        data-cy="k8s-jobs-removeJobButton"
      >
        Remove
      </LoadingButton>

      <CreateFromManifestButton
        params={{ tab: 'jobs' }}
        data-cy="k8s-jobs-deploy-button"
      />
    </Authorized>
  );

  async function handleRemoveClick(jobs: SelectedJob[]) {
    const confirmed = await confirmDelete(
      <>
        <p>Are you sure you want to delete the selected job(s)?</p>
        <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
          {jobs.map((s, index) => (
            <li key={index}>
              {s.Namespace}/{s.Name}
            </li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: Record<string, string[]> = {};
    jobs.forEach((r) => {
      payload[r.Namespace] = payload[r.Namespace] || [];
      payload[r.Namespace].push(r.Name);
    });

    deleteJobsMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Jobs successfully removed',
            jobs.map((r) => `${r.Namespace}/${r.Name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete jobs',
            error as Error,
            jobs.map((r) => `${r.Namespace}/${r.Name}`).join(', ')
          );
        },
      }
    );

    return jobs;
  }
}
