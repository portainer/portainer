import { Trash2, UserCheck } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings as KubeTableSettings,
} from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { LoadingButton } from '@@/buttons';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';

import { useRoleBindings } from '../RoleBindingsDatatable/queries/useRoleBindings';
import { RoleBinding } from '../RoleBindingsDatatable/types';

import { columns } from './columns';
import { Role, RoleRowData } from './types';
import { useRoles } from './queries/useRoles';
import { useDeleteRolesMutation } from './queries/useDeleteRolesMutation';

const storageKey = 'roles';
interface TableSettings
  extends KubeTableSettings,
    FilteredColumnsTableSettings {}

export function RolesDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
  const rolesQuery = useRoles(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const roleBindingsQuery = useRoleBindings(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const roleRowData = useRoleRowData(rolesQuery.data, roleBindingsQuery.data);

  const filteredRoles = useMemo(
    () =>
      tableState.showSystemResources
        ? roleRowData
        : roleRowData.filter((role) => !role.isSystem),
    [roleRowData, tableState.showSystemResources]
  );

  return (
    <Datatable
      dataset={filteredRoles || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={rolesQuery.isLoading || roleBindingsQuery.isLoading}
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

// Mark roles that are used by a role binding

// Mark roles that are used by a role binding
function useRoleRowData(
  roles?: Role[],
  roleBindings?: RoleBinding[]
): RoleRowData[] {
  const roleRowData = useMemo(
    () =>
      roles?.map((role) => {
        const isUsed = roleBindings?.some(
          (roleBinding) =>
            roleBinding.roleRef.name === role.name &&
            roleBinding.namespace === role.namespace
        );
        return { ...role, isUnused: !isUsed };
      }),
    [roles, roleBindings]
  );

  return roleRowData ?? [];
}
