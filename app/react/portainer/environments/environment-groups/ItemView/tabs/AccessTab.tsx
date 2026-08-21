import {
  PortainerTeamAccessPolicies,
  PortainerUserAccessPolicies,
} from '@api/types.gen';

import { notifySuccess } from '@/portainer/services/notifications';
import { useIdParam } from '@/react/hooks/useIdParam';
import { AccessDatatable } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';
import { Option } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';

import { useGroup } from '../../queries/useGroup';
import { useGroupAccesses } from '../../queries/useGroupAccesses';
import { useUpdateGroupAccessMutation } from '../../queries/useUpdateGroupAccessMutation';

import { CreateAccessWidget } from './CreateAccessWidget';

export function AccessTab() {
  const groupId = useIdParam();
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data;
  const { availableUsersAndTeams, authorizedUsersAndTeams, isLoading } =
    useGroupAccesses(group);
  const createMutation = useUpdateGroupAccessMutation();
  const datatableMutation = useUpdateGroupAccessMutation();

  return (
    <>
      <div className="m-4">
        <CreateAccessWidget
          availableUsersAndTeams={availableUsersAndTeams as Array<Option>}
          isLoading={isLoading || groupQuery.isLoading}
          isUpdating={createMutation.isLoading}
          onSubmit={handleCreate}
        />
      </div>
      <AccessDatatable
        tableKey="access_group"
        dataset={authorizedUsersAndTeams}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        showWarning
        showRoles
        isUpdateEnabled
        isUpdatingAccess={datatableMutation.isLoading}
        isLoading={isLoading || groupQuery.isLoading}
      />
    </>
  );

  function handleCreate(
    usersAndTeams: Array<Option>,
    roleId: number,
    onSuccess: () => void
  ) {
    updatePolicies(
      createMutation,
      usersAndTeams.map((access) => ({ ...access, Role: { Id: roleId } })),
      'set',
      'Access successfully updated',
      onSuccess
    );
  }

  function handleUpdate(
    updatedUsers: Array<Access>,
    updatedTeams: Array<Access>
  ) {
    updatePolicies(
      datatableMutation,
      [...updatedUsers, ...updatedTeams],
      'set',
      'Access successfully updated'
    );
  }

  function handleRemove(accesses: Array<Access>) {
    updatePolicies(
      datatableMutation,
      accesses,
      'delete',
      'Access successfully removed'
    );
  }

  function updatePolicies(
    mutation: ReturnType<typeof useUpdateGroupAccessMutation>,
    accesses: Array<{ Id: number; Type: string; Role?: { Id: number } }>,
    action: 'set' | 'delete',
    successMessage: string,
    onSuccess?: () => void
  ) {
    if (!group) {
      return;
    }

    const userAccessPolicies: PortainerUserAccessPolicies = {
      ...group.UserAccessPolicies,
    };
    const teamAccessPolicies: PortainerTeamAccessPolicies = {
      ...group.TeamAccessPolicies,
    };

    accesses.forEach((access) => {
      const policies =
        access.Type === 'user' ? userAccessPolicies : teamAccessPolicies;

      if (action === 'delete') {
        delete policies[access.Id];
      } else {
        policies[access.Id] = { RoleId: access.Role?.Id ?? 0 };
      }
    });

    mutation.mutate(
      { id: group.Id, userAccessPolicies, teamAccessPolicies },
      {
        onSuccess: () => {
          notifySuccess('Success', successMessage);
          onSuccess?.();
        },
      }
    );
  }
}
