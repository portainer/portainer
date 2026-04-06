import { User as UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useUsers } from '@/portainer/users/queries';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { useSettings } from '@/react/portainer/settings/queries';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  mutationOptions,
  withGlobalError,
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
  const { t } = useTranslation();
  const removeMutation = useRemoveMutation();
  const { isPureAdmin } = useCurrentUser();
  const usersQuery = useUsers(isPureAdmin);
  const membershipsQuery = useTeamMemberships();
  const settingsQuery = useSettings();
  const tableState = useTableState(store, 'users');

  const dataset: Array<DecoratedUser> | null = useMemo(() => {
    if (!usersQuery.data || !membershipsQuery.data || !settingsQuery.data) {
      return null;
    }

    const memberships = membershipsQuery.data;

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
  }, [membershipsQuery.data, settingsQuery.data, usersQuery.data]);

  return (
    <Datatable
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      title={t('users.title')}
      titleIcon={UserIcon}
      settingsManager={tableState}
      isRowSelectable={(row) => row.original.Id !== 1}
      renderTableActions={(selectedUsers) => (
        <DeleteButton
          disabled={selectedUsers.length === 0}
          confirmMessage={t('users.remove_confirm')}
          onConfirmed={() =>
            removeMutation.mutate(
              selectedUsers.map((i) => i.Id),
              {
                onSuccess: () => {
                  notifySuccess(t('users.remove_success'), '');
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
  const { t } = useTranslation();

  return useMutation(
    async (ids: TeamId[]) => processItemsInBatches(ids, deleteUser),
    mutationOptions(
      withGlobalError(t('users.remove_error')),
      withInvalidate(queryClient, [userQueryKeys.base()])
    )
  );
}
