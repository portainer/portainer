import { User as UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserMembership, useUsers } from '@/portainer/users/queries';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useCurrentUser } from '@/react/hooks/useUser';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { useTeamMemberships } from '../../teams/queries/useTeamMemberships';
import { TeamId, TeamRole } from '../../teams/types';
import { deleteUser } from '../../queries/useDeleteUserMutation';

import { columns } from './columns';
import { DecoratedUser } from './types';

const store = createPersistedStore('users');

export function UsersDatatable() {
  const removeMutation = useRemoveMutation();
  const { user: currentUser, isPureAdmin } = useCurrentUser();
  const usersQuery = useUsers(isPureAdmin);
  const leadsTeamQuery = useUserMembership(currentUser.Id, {
    enabled: !isPureAdmin,
    select: (memberships) =>
      memberships.some((membership) => membership.Role === TeamRole.Leader),
  });
  const canListMemberships = isPureAdmin || !!leadsTeamQuery.data;
  const membershipsQuery = useTeamMemberships(undefined, {
    enabled: canListMemberships,
  });
  const settingsQuery = usePublicSettings();
  const tableState = useTableState(store, 'users');

  const dataset: Array<DecoratedUser> | null = useMemo(() => {
    const memberships = canListMemberships ? membershipsQuery.data : [];

    if (
      !usersQuery.data ||
      !memberships ||
      !settingsQuery.data ||
      leadsTeamQuery.isInitialLoading
    ) {
      return null;
    }

    return usersQuery.data.map((user) => {
      const teamMembership = memberships.find(
        (membership) => membership.UserID === user.Id
      );

      return {
        ...user,
        isTeamLeader: teamMembership?.Role === TeamRole.Leader,
        authMethod:
          AuthenticationMethod[
            user.Id === 1
              ? AuthenticationMethod.Internal
              : settingsQuery.data.AuthenticationMethod
          ],
      };
    });
  }, [
    canListMemberships,
    leadsTeamQuery.isInitialLoading,
    membershipsQuery.data,
    settingsQuery.data,
    usersQuery.data,
  ]);

  return (
    <Datatable
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      title="Users"
      titleIcon={UserIcon}
      settingsManager={tableState}
      isRowSelectable={(row) => row.original.Id !== 1}
      renderTableActions={(selectedUsers) => (
        <DeleteButton
          disabled={selectedUsers.length === 0}
          confirmMessage="Do you want to remove the selected users? They will not be able to login into Portainer anymore."
          onConfirmed={() =>
            removeMutation.mutate(
              selectedUsers.map((i) => i.Id),
              {
                onSuccess: () => {
                  notifySuccess('Users successfully removed', '');
                },
              }
            )
          }
          data-cy="remove-users-button"
          isLoading={removeMutation.isLoading}
        />
      )}
      data-cy="users-datatable"
    />
  );
}

function useRemoveMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (ids: TeamId[]) => processItemsInBatches(ids, deleteUser),
    mutationOptions(
      withError('Unable to remove users'),
      withInvalidate(queryClient, [userQueryKeys.base()])
    )
  );
}
