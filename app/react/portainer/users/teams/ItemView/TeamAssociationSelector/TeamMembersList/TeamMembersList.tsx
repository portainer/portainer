import { useMemo, useState } from 'react';
import { Users, UserX } from 'lucide-react';

import { User, UserId } from '@/portainer/users/types';
import { TeamId, TeamRole } from '@/react/portainer/users/teams/types';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRemoveMemberMutation,
  useTeamMemberships,
} from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';
import { Datatable } from '@@/datatables';

import { RowContext, RowProvider } from './RowContext';
import { columns } from './columns';

interface Props {
  users: User[];
  roles: Record<UserId, TeamRole>;
  disabled?: boolean;
  teamId: TeamId;
}

export function TeamMembersList({ users, roles, disabled, teamId }: Props) {
  const membershipsQuery = useTeamMemberships(teamId);

  const removeMemberMutation = useRemoveMemberMutation(
    teamId,
    membershipsQuery.data
  );

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<
    { id: string; desc: boolean } | undefined
  >({ id: 'name', desc: false });

  const isPureAdmin = useIsPureAdmin();
  const rowContext = useMemo<RowContext>(
    () => ({
      getRole(userId: UserId) {
        return roles[userId];
      },
      disabled,
      teamId,
    }),
    [roles, disabled, teamId]
  );

  return (
    <RowProvider context={rowContext}>
      <Datatable<User>
        dataset={users}
        columns={columns}
        titleIcon={Users}
        title="Team members"
        renderTableActions={() =>
          isPureAdmin && (
            <Button
              onClick={() => handleRemoveMembers(users.map((user) => user.Id))}
              disabled={disabled || users.length === 0}
              icon={UserX}
              data-cy="remove-all-users-button"
            >
              Remove all users
            </Button>
          )
        }
        disableSelect
        settingsManager={{
          pageSize,
          setPageSize,
          sortBy,
          setSortBy: handleSetSort,
          search,
          setSearch,
        }}
        data-cy="team-members-datatable"
      />
    </RowProvider>
  );

  function handleSetSort(colId: string | undefined, desc: boolean) {
    setSortBy(colId ? { id: colId, desc } : undefined);
  }

  function handleRemoveMembers(userIds: UserId[]) {
    removeMemberMutation.mutate(userIds, {
      onSuccess() {
        notifySuccess('Success', 'All users successfully removed');
      },
    });
  }
}
