import { TeamRole, TeamId } from '@/react/portainer/users/teams/types';
import { UserId } from '@/portainer/users/types';

import { createRowContext } from '@@/datatables/RowContext';

export interface RowContext {
  getRole(userId: UserId): TeamRole;
  disabled?: boolean;
  teamId: TeamId;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
