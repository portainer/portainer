import { Environment } from '@/react/portainer/environments/types';

import { createRowContext } from '@@/datatables/RowContext';

interface RowContextState {
  environment: Environment;
  isMetricsEnabled: boolean;
}

const { RowProvider, useRowContext } = createRowContext<RowContextState>();

export { RowProvider, useRowContext };
