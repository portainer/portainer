import { CellProps, Column } from 'react-table';
import { MinusCircle } from 'react-feather';

import { User, UserId } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRemoveMemberMutation,
  useTeamMemberships,
} from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';

import { useRowContext } from './RowContext';

export const name: Column<User> = {
  Header: 'Name',
  accessor: (row) => row.Username,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function NameCell({
  value: name,
  row: { original: user },
}: CellProps<User, string>) {
  const { disabled, teamId } = useRowContext();

  const membershipsQuery = useTeamMemberships(teamId);

  const removeMemberMutation = useRemoveMemberMutation(
    teamId,
    membershipsQuery.data
  );

  return (
    <>
      {name}

      <Button
        color="link"
        className="space-left nopadding"
        onClick={() => handleRemoveMember(user.Id)}
        disabled={disabled}
        icon={MinusCircle}
      >
        Remove
      </Button>
    </>
  );

  function handleRemoveMember(userId: UserId) {
    removeMemberMutation.mutate([userId], {
      onSuccess() {
        notifySuccess('User removed from team', name);
      },
    });
  }
}
