import { UserX } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { useUsers } from '@/portainer/users/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useTeams } from '@/react/portainer/users/teams/queries';
import { PortainerNamespaceAccessesConfigMap } from '@/react/kubernetes/configs/constants';
import { useConfigMap } from '@/react/kubernetes/configs/queries/useConfigMap';
import { useUpdateK8sConfigMapMutation } from '@/react/kubernetes/configs/queries/useUpdateK8sConfigMapMutation';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Datatable } from '@@/datatables';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { parseNamespaceAccesses } from '../parseNamespaceAccesses';
import { NamespaceAccess } from '../types';
import { createUnauthorizeAccessConfigMapPayload } from '../createAccessConfigMapPayload';

import { entityType } from './columns/type';
import { name } from './columns/name';

const tableKey = 'kubernetes_resourcepool_access';
const columns = [name, entityType];
const store = createPersistedStore(tableKey);

export function AccessDatatable() {
  const {
    params: { id: namespaceName },
  } = useCurrentStateAndParams();
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const tableState = useTableState(store, tableKey);
  const usersQuery = useUsers(false, environmentId);
  const teamsQuery = useTeams(false, environmentId);
  const accessConfigMapQuery = useConfigMap(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace,
    PortainerNamespaceAccessesConfigMap.configMapName
  );
  const namespaceAccesses = useMemo(
    () =>
      parseNamespaceAccesses(
        accessConfigMapQuery.data ?? null,
        namespaceName,
        usersQuery.data ?? [],
        teamsQuery.data ?? []
      ),
    [accessConfigMapQuery.data, usersQuery.data, teamsQuery.data, namespaceName]
  );
  const configMap = accessConfigMapQuery.data;

  const updateConfigMapMutation = useUpdateK8sConfigMapMutation(
    environmentId,
    PortainerNamespaceAccessesConfigMap.namespace
  );

  return (
    <Datatable
      data-cy="kube-namespace-access-datatable"
      title="Namespace access"
      titleIcon={UserX}
      dataset={namespaceAccesses}
      isLoading={accessConfigMapQuery.isLoading}
      columns={columns}
      settingsManager={tableState}
      // the user id and team id can be the same, so add the type to the id
      getRowId={(row) => `${row.type}-${row.id}`}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          isLoading={updateConfigMapMutation.isLoading}
          loadingText="Removing..."
          confirmMessage="Are you sure you want to unauthorized the selected users or teams?"
          onConfirmed={() => handleUpdate(selectedItems)}
          disabled={
            selectedItems.length === 0 ||
            usersQuery.isLoading ||
            teamsQuery.isLoading ||
            accessConfigMapQuery.isLoading
          }
          data-cy="remove-access-button"
        />
      )}
    />
  );

  async function handleUpdate(selectedItemsToRemove: Array<NamespaceAccess>) {
    try {
      const configMapPayload = createUnauthorizeAccessConfigMapPayload(
        namespaceAccesses,
        selectedItemsToRemove,
        namespaceName,
        configMap
      );
      await updateConfigMapMutation.mutateAsync({
        configMap: configMapPayload,
        configMapName: PortainerNamespaceAccessesConfigMap.configMapName,
      });
      notifySuccess('Success', 'Namespace access updated');
      router.stateService.reload();
    } catch (error) {
      notifyError('Failed to update namespace access', error as Error);
    }
  }
}
