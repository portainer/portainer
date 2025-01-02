import { User } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import {
  DefaultDatatableSettings,
  TableSettings as KubeTableSettings,
} from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { DeleteButton } from '@@/buttons/DeleteButton';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';

import { ServiceAccount } from '../types';

import { columns } from './columns';
import { useDeleteServiceAccountsMutation } from './queries/useDeleteServiceAccountsMutation';
import { useGetAllServiceAccountsQuery } from './queries/useGetAllServiceAccountsQuery';

const storageKey = 'serviceAccounts';
interface TableSettings
  extends KubeTableSettings,
    FilteredColumnsTableSettings {}

export function ServiceAccountsDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
  const serviceAccountsQuery = useGetAllServiceAccountsQuery(environmentId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
  });
  const filteredServiceAccounts = useMemo(
    () =>
      tableState.showSystemResources
        ? serviceAccountsQuery.data
        : serviceAccountsQuery.data?.filter((sa) => !sa.isSystem),
    [serviceAccountsQuery.data, tableState.showSystemResources]
  );

  return (
    <Datatable
      dataset={filteredServiceAccounts || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={serviceAccountsQuery.isLoading}
      emptyContentLabel="No service accounts found"
      title="Service Accounts"
      titleIcon={User}
      getRowId={(row) => row.uid}
      isRowSelectable={(row) => !row.original.isSystem}
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
      data-cy="k8s-service-accounts-datatable"
    />
  );
}

interface SelectedServiceAccount {
  namespace: string;
  name: string;
}

type TableActionsProps = {
  selectedItems: ServiceAccount[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteServiceAccountsMutation =
    useDeleteServiceAccountsMutation(environmentId);
  const router = useRouter();

  return (
    <Authorized authorizations="K8sServiceAccountsW">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemoveClick(selectedItems)}
        confirmMessage={
          <>
            <p>
              Are you sure you want to delete the selected service account(s)?
            </p>
            <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
              {selectedItems.map((s, index) => (
                <li key={index}>
                  {s.namespace}/{s.name}
                </li>
              ))}
            </ul>
          </>
        }
        data-cy="k8s-service-accounts-datatable-remove-button"
      />

      <CreateFromManifestButton data-cy="k8s-service-accounts-datatable-create-button" />
    </Authorized>
  );

  async function handleRemoveClick(serviceAccounts: SelectedServiceAccount[]) {
    const payload: Record<string, string[]> = {};
    serviceAccounts.forEach((sa) => {
      payload[sa.namespace] = payload[sa.namespace] || [];
      payload[sa.namespace].push(sa.name);
    });

    deleteServiceAccountsMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Service account(s) successfully removed',
            serviceAccounts.map((sa) => `${sa.namespace}/${sa.name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete service account(s)',
            error as Error,
            serviceAccounts.map((sa) => `${sa.namespace}/${sa.name}`).join(', ')
          );
        },
      }
    );
  }
}
