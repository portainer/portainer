import { User as UserIcon, UserPlus, UserX } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import { User } from '@/portainer/users/types';
import { useCurrentUser } from '@/react/hooks/useUser';
import { TeamRole } from '@/react/portainer/users/teams/types';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  useTeamMemberships,
  useUpdateRoleMutation,
} from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const teamRole = columnHelper.accessor('Id', {
  header: 'Team Role',
  id: 'role',
  cell: RoleCell,
});

function RoleCell({
  row: { original: user },
  getValue,
}: CellContext<User, User['Id']>) {
  const id = getValue();

  const { getRole, disabled, teamId } = useRowContext();
  const membershipsQuery = useTeamMemberships(teamId);
  const updateRoleMutation = useUpdateRoleMutation(
    teamId,
    membershipsQuery.data
  );

  const role = getRole(id);

  const { isPureAdmin } = useCurrentUser();

  const Cell = role === TeamRole.Leader ? LeaderCell : MemberCell;

  return (
    <Cell
      isAdmin={isPureAdmin}
      onClick={handleUpdateRole}
      disabled={disabled}
      username={user.Username}
    />
  );

  function handleUpdateRole(role: TeamRole, onSuccessMessage: string) {
    updateRoleMutation.mutate(
      { userId: user.Id, role },
      {
        onSuccess() {
          notifySuccess(onSuccessMessage, user.Username);
        },
      }
    );
  }
}

interface LeaderCellProps {
  isAdmin: boolean;
  onClick: (role: TeamRole, onSuccessMessage: string) => void;
  username: string;
  disabled?: boolean;
}

function LeaderCell({ isAdmin, onClick, disabled, username }: LeaderCellProps) {
  return (
    <div className="flex items-center">
      <Icon className="space-right" icon={UserPlus} mode="secondary-alt" />

      {isAdmin && (
        <Button
          color="link"
          className="nopadding"
          onClick={() => onClick(TeamRole.Member, 'User is now team member')}
          disabled={disabled}
          icon={UserX}
          data-cy={`remove-leader-${username}`}
        >
          Member
        </Button>
      )}
    </div>
  );
}

interface MemberCellProps {
  onClick: (role: TeamRole, onSuccessMessage: string) => void;
  disabled?: boolean;
  username: string;
}

function MemberCell({ onClick, disabled, username }: MemberCellProps) {
  return (
    <div className="flex items-center">
      <Icon className="space-right" icon={UserIcon} mode="secondary-alt" />
      <Button
        color="link"
        className="nopadding"
        onClick={() => onClick(TeamRole.Leader, 'User is now team leader')}
        disabled={disabled}
        icon={UserPlus}
        data-cy={`make-leader-${username}`}
      >
        Leader
      </Button>
    </div>
  );
}
