import { useMemo } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { Pod, Secret } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { usePods } from '@/react/kubernetes/applications/usePods';
import { useJobs } from '@/react/kubernetes/applications/useJobs';
import { useCronJobs } from '@/react/kubernetes/applications/useCronJobs';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { confirmDelete } from '@@/modals/confirm';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import {
  useSecretsForCluster,
  useMutationDeleteSecrets,
} from '../../secret.service';
import { IndexOptional } from '../../types';

import { getIsSecretInUse } from './utils';
import { SecretRowData } from './types';
import { columns } from './columns';

const storageKey = 'k8sSecretsDatatable';
const settingsStore = createStore(storageKey);

export function SecretsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const { authorized: canWrite } = useAuthorizations(['K8sSecretsW']);
  const readOnly = !canWrite;
  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );

  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespacesQuery(
    environmentId,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const namespaceNames = Object.keys(namespaces || {});
  const { data: secrets, ...secretsQuery } = useSecretsForCluster(
    environmentId,
    namespaceNames,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const podsQuery = usePods(environmentId, namespaceNames);
  const jobsQuery = useJobs(environmentId, namespaceNames);
  const cronJobsQuery = useCronJobs(environmentId, namespaceNames);
  const isInUseLoading =
    podsQuery.isLoading || jobsQuery.isLoading || cronJobsQuery.isLoading;

  const filteredSecrets = useMemo(
    () =>
      secrets?.filter(
        (secret) =>
          (canAccessSystemResources && tableState.showSystemResources) ||
          !namespaces?.[secret.metadata?.namespace ?? '']?.IsSystem
      ) || [],
    [secrets, tableState, canAccessSystemResources, namespaces]
  );
  const secretRowData = useSecretRowData(
    filteredSecrets,
    podsQuery.data ?? [],
    jobsQuery.data ?? [],
    cronJobsQuery.data ?? [],
    isInUseLoading,
    namespaces
  );

  return (
    <Datatable<IndexOptional<SecretRowData>>
      dataset={secretRowData}
      columns={columns}
      settingsManager={tableState}
      isLoading={secretsQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No secrets found"
      title="Secrets"
      titleIcon={Lock}
      getRowId={(row) => row.metadata?.uid ?? ''}
      isRowSelectable={(row) =>
        !namespaces?.[row.original.metadata?.namespace ?? '']?.IsSystem
      }
      disableSelect={readOnly}
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
    />
  );
}

// useSecretRowData appends the `inUse` property to the secret data (for the unused badge in the name column)
// and wraps with useMemo to prevent unnecessary calculations
function useSecretRowData(
  secrets: Secret[],
  pods: Pod[],
  jobs: Job[],
  cronJobs: CronJob[],
  isInUseLoading: boolean,
  namespaces?: Namespaces
): SecretRowData[] {
  return useMemo(
    () =>
      secrets.map((secret) => ({
        ...secret,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          isInUseLoading || getIsSecretInUse(secret, pods, jobs, cronJobs),
        isSystem: namespaces
          ? namespaces?.[secret.metadata?.namespace ?? '']?.IsSystem
          : false,
      })),
    [secrets, isInUseLoading, pods, jobs, cronJobs, namespaces]
  );
}

function TableActions({ selectedItems }: { selectedItems: SecretRowData[] }) {
  const environmentId = useEnvironmentId();
  const deleteSecretMutation = useMutationDeleteSecrets(environmentId);

  async function handleRemoveClick(secrets: SecretRowData[]) {
    const confirmed = await confirmDelete(
      `Are you sure you want to remove the selected ${pluralize(
        secrets.length,
        'secret'
      )}?`
    );
    if (!confirmed) {
      return;
    }

    const secretsToDelete = secrets.map((secret) => ({
      namespace: secret.metadata?.namespace ?? '',
      name: secret.metadata?.name ?? '',
    }));

    await deleteSecretMutation.mutateAsync(secretsToDelete);
  }

  return (
    <Authorized authorizations="K8sSecretsW">
      <Button
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={async () => {
          handleRemoveClick(selectedItems);
        }}
        icon={Trash2}
        data-cy="k8sSecret-removeSecretButton"
      >
        Remove
      </Button>
      <Link to="kubernetes.secrets.new" className="ml-1">
        <Button
          className="btn-wrapper"
          color="secondary"
          icon={Plus}
          data-cy="k8sSecret-addSecretWithFormButton"
        >
          Add with form
        </Button>
      </Link>
      <Link
        to="kubernetes.deploy"
        params={{
          referrer: 'kubernetes.configurations',
          tab: 'secrets',
        }}
        className="ml-1"
        data-cy="k8sSecret-deployFromManifestButton"
      >
        <Button className="btn-wrapper" color="primary" icon={Plus}>
          Create from manifest
        </Button>
      </Link>
    </Authorized>
  );
}
