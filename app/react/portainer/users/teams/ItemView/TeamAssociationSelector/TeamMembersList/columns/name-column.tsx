import { MinusCircle } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import { User, UserId } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCurrentUser } from '@/react/hooks/useUser';
import {
  useRemoveMemberMutation,
  useTeamMemberships,
} from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Username', {
  header: 'Name',
  id: 'name',
  cell: NameCell,
});

export function NameCell({
  getValue,
  row: { original: user },
}: CellContext<User, string>) {
  const name = getValue();
  const { disabled, teamId } = useRowContext();
  const { user: currentUser, isPureAdmin } = useCurrentUser();
  const canRemove = isPureAdmin || currentUser.Id !== user.Id;

  const membershipsQuery = useTeamMemberships(teamId);

  const removeMemberMutation = useRemoveMemberMutation(
    teamId,
    membershipsQuery.data
  );

  return (
    <>
      {name}

      {canRemove && (
        <Button
          color="link"
          data-cy={`remove-member-${user.Username}`}
          className="space-left !p-0"
          onClick={() => handleRemoveMember(user.Id)}
          disabled={disabled}
          icon={MinusCircle}
        >
          Remove
        </Button>
      )}
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
