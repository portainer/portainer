import { TeamId } from '@/react/portainer/users/teams/types';

import { createRowContext } from '@@/datatables/RowContext';

interface RowContext {
  disabled?: boolean;
  teamId: TeamId;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
