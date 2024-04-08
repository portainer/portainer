import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { Secret } from 'kubernetes-types/core/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { useApplicationsQuery } from '@/react/kubernetes/applications/application.queries';
import { Application } from '@/react/kubernetes/applications/types';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

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
  const { data: applications, ...applicationsQuery } = useApplicationsQuery(
    environmentId,
    namespaceNames
  );

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
    applications ?? [],
    applicationsQuery.isLoading,
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
  applications: Application[],
  applicationsLoading: boolean,
  namespaces?: Namespaces
): SecretRowData[] {
  return useMemo(
    () =>
      secrets.map((secret) => ({
        ...secret,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          applicationsLoading || getIsSecretInUse(secret, applications),
        isSystem: namespaces
          ? namespaces?.[secret.metadata?.namespace ?? '']?.IsSystem
          : false,
      })),
    [secrets, applicationsLoading, applications, namespaces]
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
