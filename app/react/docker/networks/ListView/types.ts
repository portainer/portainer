import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { DockerNetwork } from '../types';

export type DockerNetworkViewModel = DockerNetwork & {
  StackName?: string;
  ResourceControl?: ResourceControlViewModel;
  NodeName?: string;
  Subs?: DockerNetworkViewModel[];
  Highlighted: boolean;
};
