import { CellProps, Column } from 'react-table';
import { PlusCircle } from 'react-feather';

import { User } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Button } from '@@/buttons';

import { useAddMemberMutation } from '../../../queries';
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

  const addMemberMutation = useAddMemberMutation(teamId);

  const { disabled } = useRowContext();
  return (
    <>
      {name}

      <Button
        color="link"
        className="space-left nopadding"
        disabled={disabled}
        icon={PlusCircle}
        onClick={() => handleAddMember()}
      >
        Add
      </Button>
    </>
  );

  function handleAddMember() {
    addMemberMutation.mutate([user.Id], {
      onSuccess() {
        notifySuccess('User added to team', name);
      },
    });
  }
}
