import { getPlatformType } from '@/react/portainer/environments/utils';
import {
  EnvironmentType,
  PlatformType,
} from '@/react/portainer/environments/types';

import Docker from './docker.svg?c';
import Azure from './azure.svg?c';
import Kubernetes from './kubernetes.svg?c';
import Nomad from './nomad.svg?c';

const icons: {
  [key in PlatformType]: SvgrComponent;
} = {
  [PlatformType.Docker]: Docker,
  [PlatformType.Kubernetes]: Kubernetes,
  [PlatformType.Azure]: Azure,
  [PlatformType.Nomad]: Nomad,
};

export function getPlatformIcon(type: EnvironmentType) {
  const platform = getPlatformType(type);

  return icons[platform];
}
