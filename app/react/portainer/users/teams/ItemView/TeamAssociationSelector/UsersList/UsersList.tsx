import { useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';

import { User, UserId } from '@/portainer/users/types';
import { useUser } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import { useAddMemberMutation } from '@/react/portainer/users/teams/queries';
import { TeamId } from '@/react/portainer/users/teams/types';

import { Button } from '@@/buttons';
import { Datatable } from '@@/datatables';

import { name } from './name-column';
import { RowProvider } from './RowContext';

const columns = [name];

interface Props {
  users: User[];
  disabled?: boolean;
  teamId: TeamId;
}

export function UsersList({ users, disabled, teamId }: Props) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const addMemberMutation = useAddMemberMutation(teamId);
  const [sortBy, setSortBy] = useState({ id: 'name', desc: false });

  const { isAdmin } = useUser();

  const rowContext = useMemo(() => ({ disabled, teamId }), [disabled, teamId]);

  return (
    <RowProvider context={rowContext}>
      <Datatable<User>
        dataset={users}
        columns={columns}
        titleIcon={Users}
        title="Users"
        renderTableActions={() =>
          isAdmin && (
            <Button
              onClick={() => handleAddAllMembers(users.map((u) => u.Id))}
              disabled={disabled || users.length === 0}
              icon={UserPlus}
            >
              Add all users
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
      />
    </RowProvider>
  );

  function handleSetSort(colId: string, desc: boolean) {
    setSortBy({ id: colId, desc });
  }

  function handleAddAllMembers(userIds: UserId[]) {
    addMemberMutation.mutate(userIds, {
      onSuccess() {
        notifySuccess('Success', 'All users successfully added');
      },
    });
  }
}
