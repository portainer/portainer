import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { Pod, Secret } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import {
  DefaultDatatableSettings,
  TableSettings as KubeTableSettings,
} from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { usePods } from '@/react/kubernetes/applications/usePods';
import { useJobs } from '@/react/kubernetes/applications/useJobs';
import { useCronJobs } from '@/react/kubernetes/applications/useCronJobs';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import {
  useSecretsForCluster,
  useMutationDeleteSecrets,
} from '../../secret.service';
import { IndexOptional } from '../../types';

import { getIsSecretInUse } from './utils';
import { SecretRowData } from './types';
import { columns } from './columns';

const storageKey = 'k8sSecretsDatatable';

interface TableSettings
  extends KubeTableSettings,
    FilteredColumnsTableSettings {}

export function SecretsDatatable() {
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
  const environmentId = useEnvironmentId();
  const { authorized: canWrite } = useAuthorizations(['K8sSecretsW']);
  const readOnly = !canWrite;
  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );

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
      data-cy="k8s-secrets-datatable"
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
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
    const secretsToDelete = secrets.map((secret) => ({
      namespace: secret.metadata?.namespace ?? '',
      name: secret.metadata?.name ?? '',
    }));

    await deleteSecretMutation.mutateAsync(secretsToDelete);
  }

  return (
    <Authorized authorizations="K8sSecretsW">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemoveClick(selectedItems)}
        data-cy="k8sSecret-removeSecretButton"
        confirmMessage={`Are you sure you want to remove the selected ${pluralize(
          selectedItems.length,
          'secret'
        )}?`}
      />
      <AddButton
        to="kubernetes.secrets.new"
        data-cy="k8sSecret-addSecretWithFormButton"
        color="secondary"
      >
        Add with form
      </AddButton>
      <CreateFromManifestButton
        params={{
          tab: 'secrets',
        }}
        data-cy="k8sSecret-deployFromManifestButton"
      />
    </Authorized>
  );
}
