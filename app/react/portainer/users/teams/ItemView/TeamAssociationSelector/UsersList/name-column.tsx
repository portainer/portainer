import { CellProps, Column } from 'react-table';
import { PlusCircle } from 'react-feather';

import { User } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useAddMemberMutation } from '@/react/portainer/users/teams/queries';

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

  const addMemberMutation = useAddMemberMutation(teamId);

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
