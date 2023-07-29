import { useMemo } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { Secret } from 'kubernetes-types/core/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  Authorized,
  useAuthorizations,
  useCurrentUser,
} from '@/react/hooks/useUser';
import { useNamespaces } from '@/react/kubernetes/namespaces/queries';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/utils';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { useApplicationsForCluster } from '@/react/kubernetes/applications/application.queries';
import { Application } from '@/react/kubernetes/applications/types';
import { pluralize } from '@/portainer/helpers/strings';

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
  const readOnly = !useAuthorizations(['K8sSecretsW']);
  const { isAdmin } = useCurrentUser();

  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespaces(
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
  const { data: applications, ...applicationsQuery } =
    useApplicationsForCluster(environmentId, namespaceNames);

  const filteredSecrets = useMemo(
    () =>
      secrets?.filter(
        (secret) =>
          (isAdmin && tableState.showSystemResources) ||
          !isSystemNamespace(secret.metadata?.namespace ?? '')
      ) || [],
    [secrets, tableState, isAdmin]
  );
  const secretRowData = useSecretRowData(
    filteredSecrets,
    applications ?? [],
    applicationsQuery.isLoading
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
        !isSystemNamespace(row.original.metadata?.namespace ?? '')
      }
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings
            settings={tableState}
            hideShowSystemResources={!isAdmin}
          />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources || !isAdmin}
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
  applicationsLoading: boolean
): SecretRowData[] {
  return useMemo(
    () =>
      secrets.map((secret) => ({
        ...secret,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          applicationsLoading || getIsSecretInUse(secret, applications),
      })),
    [secrets, applicationsLoading, applications]
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
