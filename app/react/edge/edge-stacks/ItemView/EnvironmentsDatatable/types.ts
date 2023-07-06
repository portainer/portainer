import { Environment } from '@/react/portainer/environments/types';

import { EdgeStackStatus } from '../../types';

export type EdgeStackEnvironment = Environment & {
  StackStatus: EdgeStackStatus;
  TargetVersion: string;
  GitConfigURL: string;
  TargetCommitHash: string;
};
