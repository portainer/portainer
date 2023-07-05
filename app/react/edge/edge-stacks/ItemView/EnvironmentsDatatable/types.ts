import { Environment } from '@/react/portainer/environments/types';

import { DeploymentStatus } from '../../types';

export type EdgeStackEnvironment = Environment & {
  StackStatus: Array<DeploymentStatus>;
};
