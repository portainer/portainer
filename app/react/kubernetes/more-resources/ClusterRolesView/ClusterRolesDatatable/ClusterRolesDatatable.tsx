import { Trash2, UserCheck } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { LoadingButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';

import { DefaultDatatableSettings } from '../../../datatables/DefaultDatatableSettings';
import { useClusterRoleBindings } from '../ClusterRoleBindingsDatatable/queries/useClusterRoleBindings';
import { useRoleBindings } from '../../RolesView/RoleBindingsDatatable/queries/useRoleBindings';
import { ClusterRoleBinding } from '../ClusterRoleBindingsDatatable/types';
import { RoleBinding } from '../../RolesView/RoleBindingsDatatable/types';

import { ClusterRole, ClusterRoleRowData } from './types';
import { columns } from './columns';
import { useClusterRoles } from './queries/useClusterRoles';
import { useDeleteClusterRolesMutation } from './queries/useDeleteClusterRolesMutation';

const storageKey = 'clusterRoles';
const settingsStore = createStore(storageKey);

export function ClusterRolesDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, storageKey);

  const clusterRolesQuery = useClusterRoles(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const clusterRoleBindingsQuery = useClusterRoleBindings(environmentId);
  const roleBindingsQuery = useRoleBindings(environmentId);

  const clusterRolesWithUnusedFlag = useClusterRolesWithUnusedFlag(
    clusterRolesQuery.data,
    clusterRoleBindingsQuery.data,
    roleBindingsQuery.data
  );

  const filteredClusterRoles = useMemo(
    () =>
      clusterRolesWithUnusedFlag.filter(
        (cr) => tableState.showSystemResources || !cr.isSystem
      ),
    [clusterRolesWithUnusedFlag, tableState.showSystemResources]
  );

  const isLoading =
    clusterRolesQuery.isLoading ||
    clusterRoleBindingsQuery.isLoading ||
    roleBindingsQuery.isLoading;

  const { authorized: isAuthorizedToAddEdit } = useAuthorizations([
    'K8sClusterRolesW',
  ]);

  return (
    <Datatable
      dataset={filteredClusterRoles || []}
      columns={columns}
      isLoading={isLoading}
      settingsManager={tableState}
      emptyContentLabel="No supported cluster roles found"
      title="Cluster Roles"
      titleIcon={UserCheck}
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
      disableSelect={!isAuthorizedToAddEdit}
      data-cy="k8s-clusterroles-datatable"
    />
  );
}

interface SelectedRole {
  name: string;
}

type TableActionsProps = {
  selectedItems: ClusterRole[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteClusterRolesMutation =
    useDeleteClusterRolesMutation(environmentId);
  const router = useRouter();

  async function handleRemoveClick(roles: SelectedRole[]) {
    const confirmed = await confirmDelete(
      <>
        <p>Are you sure you want to delete the selected cluster role(s)?</p>
        <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
          {roles.map((s, index) => (
            <li key={index}>{s.name}</li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: string[] = [];
    roles.forEach((r) => {
      payload.push(r.name);
    });

    deleteClusterRolesMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Roles successfully removed',
            roles.map((r) => `${r.name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete cluster roles',
            error as Error,
            roles.map((r) => `${r.name}`).join(', ')
          );
        },
      }
    );
    return roles;
  }

  return (
    <Authorized authorizations="K8sClusterRolesW">
      <LoadingButton
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemoveClick(selectedItems)}
        icon={Trash2}
        isLoading={deleteClusterRolesMutation.isLoading}
        loadingText="Removing cluster roles..."
        data-cy="k8sClusterRoles-removeRoleButton"
      >
        Remove
      </LoadingButton>

      <CreateFromManifestButton
        params={{ tab: 'clusterRoles' }}
        data-cy="k8s-cluster-roles-deploy-button"
      />
    </Authorized>
  );
}

// Updated custom hook
function useClusterRolesWithUnusedFlag(
  clusterRoles?: ClusterRole[],
  clusterRoleBindings?: ClusterRoleBinding[],
  roleBindings?: RoleBinding[]
): ClusterRoleRowData[] {
  return useMemo(() => {
    if (!clusterRoles || !clusterRoleBindings || !roleBindings) {
      return [];
    }

    const usedRoleNames = new Set<string>();

    // Check ClusterRoleBindings
    clusterRoleBindings.forEach((binding) => {
      if (binding.roleRef.kind === 'ClusterRole') {
        usedRoleNames.add(binding.roleRef.name);
      }
    });

    // Check RoleBindings
    roleBindings.forEach((binding) => {
      if (binding.roleRef.kind === 'ClusterRole') {
        usedRoleNames.add(binding.roleRef.name);
      }
    });

    // Mark cluster roles as unused if they're not in the usedRoleNames set
    return clusterRoles.map((clusterRole) => ({
      ...clusterRole,
      isUnused: !usedRoleNames.has(clusterRole.name) && !clusterRole.isSystem,
    }));
  }, [clusterRoles, clusterRoleBindings, roleBindings]);
}
