import { Trash2, UserCheck } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { LoadingButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';

import { DefaultDatatableSettings } from '../../../datatables/DefaultDatatableSettings';

import { columns } from './columns';
import { Role } from './types';
import { useGetAllRolesQuery } from './queries/useGetAllRolesQuery';
import { useDeleteRolesMutation } from './queries/useDeleteRolesMutation';

const storageKey = 'roles';
const settingsStore = createStore(storageKey);

export function RolesDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, storageKey);
  const namespacesQuery = useNamespacesQuery(environmentId);
  const rolesQuery = useGetAllRolesQuery(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
    enabled: namespacesQuery.isSuccess,
  });
  useUnauthorizedRedirect(
    { authorizations: ['K8sRolesW'] },
    { to: 'kubernetes.dashboard' }
  );

  const filteredRoles = tableState.showSystemResources
    ? rolesQuery.data
    : rolesQuery.data?.filter(
        (role) => !isSystemNamespace(role.namespace, namespacesQuery.data)
      );

  return (
    <Datatable
      dataset={filteredRoles || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={rolesQuery.isLoading}
      emptyContentLabel="No roles found"
      title="Roles"
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
      data-cy="k8s-roles-datatable"
    />
  );
}

interface SelectedRole {
  namespace: string;
  name: string;
}

type TableActionsProps = {
  selectedItems: Role[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteRolesMutation = useDeleteRolesMutation(environmentId);
  const router = useRouter();

  return (
    <Authorized authorizations="K8sRolesW">
      <LoadingButton
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemoveClick(selectedItems)}
        icon={Trash2}
        isLoading={deleteRolesMutation.isLoading}
        loadingText="Removing roles..."
        data-cy="k8s-roles-removeRoleButton"
      >
        Remove
      </LoadingButton>

      <CreateFromManifestButton
        params={{ tab: 'roles' }}
        data-cy="k8s-roles-deploy-button"
      />
    </Authorized>
  );

  async function handleRemoveClick(roles: SelectedRole[]) {
    const confirmed = await confirmDelete(
      <>
        <p>Are you sure you want to delete the selected role(s)?</p>
        <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
          {roles.map((s, index) => (
            <li key={index}>
              {s.namespace}/{s.name}
            </li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: Record<string, string[]> = {};
    roles.forEach((r) => {
      payload[r.namespace] = payload[r.namespace] || [];
      payload[r.namespace].push(r.name);
    });

    deleteRolesMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Roles successfully removed',
            roles.map((r) => `${r.namespace}/${r.name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete roles',
            error as Error,
            roles.map((r) => `${r.namespace}/${r.name}`).join(', ')
          );
        },
      }
    );
    return roles;
  }
}
