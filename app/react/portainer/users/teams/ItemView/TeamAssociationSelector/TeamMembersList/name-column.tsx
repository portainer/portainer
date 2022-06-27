import { CellProps, Column } from 'react-table';
import { MinusCircle } from 'react-feather';

import { User, UserId } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Button } from '@@/buttons';

import { useRemoveMemberMutation, useTeamMemberships } from '../../../queries';
import { useTeamIdParam } from '../../useTeamIdParam';

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
  const teamId = useTeamIdParam();
  const membershipsQuery = useTeamMemberships(teamId);

  const removeMemberMutation = useRemoveMemberMutation(
    teamId,
    membershipsQuery.data
  );

  const { disabled } = useRowContext();
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
