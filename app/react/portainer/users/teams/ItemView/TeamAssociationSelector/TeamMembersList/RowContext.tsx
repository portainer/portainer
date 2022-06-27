import { TeamRole } from '@/react/portainer/users/teams/types';
import { UserId } from '@/portainer/users/types';

import { createRowContext } from '@@/datatables/RowContext';

export interface RowContext {
  getRole(userId: UserId): TeamRole;
  disabled?: boolean;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
