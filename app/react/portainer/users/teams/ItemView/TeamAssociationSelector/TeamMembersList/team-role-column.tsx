import { CellProps, Column } from 'react-table';
import { User as UserIcon, UserPlus, UserX } from 'react-feather';

import { User } from '@/portainer/users/types';
import { useUser as useCurrentUser } from '@/portainer/hooks/useUser';
import { TeamRole } from '@/react/portainer/users/teams/types';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  useTeamMemberships,
  useUpdateRoleMutation,
} from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { useRowContext } from './RowContext';

export const teamRole: Column<User> = {
  Header: 'Team Role',
  accessor: 'Id',
  id: 'role',
  Cell: RoleCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function RoleCell({ row: { original: user } }: CellProps<User>) {
  const { getRole, disabled, teamId } = useRowContext();
  const membershipsQuery = useTeamMemberships(teamId);
  const updateRoleMutation = useUpdateRoleMutation(
    teamId,
    membershipsQuery.data
  );

  const role = getRole(user.Id);

  const { isAdmin } = useCurrentUser();

  const Cell = role === TeamRole.Leader ? LeaderCell : MemberCell;

  return (
    <Cell isAdmin={isAdmin} onClick={handleUpdateRole} disabled={disabled} />
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
  disabled?: boolean;
}

function LeaderCell({ isAdmin, onClick, disabled }: LeaderCellProps) {
  return (
    <div className="flex items-center">
      <Icon
        className="space-right feather"
        icon={UserPlus}
        mode="secondary-alt"
      />

      {isAdmin && (
        <Button
          color="link"
          className="nopadding"
          onClick={() => onClick(TeamRole.Member, 'User is now team member')}
          disabled={disabled}
          icon={UserX}
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
}

function MemberCell({ onClick, disabled }: MemberCellProps) {
  return (
    <div className="flex items-center">
      <Icon
        className="space-right feather"
        icon={UserIcon}
        mode="secondary-alt"
      />
      <Button
        color="link"
        className="nopadding"
        onClick={() => onClick(TeamRole.Leader, 'User is now team leader')}
        disabled={disabled}
        icon={UserPlus}
      >
        Leader
      </Button>
    </div>
  );
}
