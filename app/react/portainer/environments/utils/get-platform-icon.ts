import { getPlatformType } from '@/react/portainer/environments/utils';
import {
  EnvironmentType,
  PlatformType,
} from '@/react/portainer/environments/types';
import Podman from '@/assets/ico/vendor/podman.svg?c';

import Docker from './docker.svg?c';
import Azure from './azure.svg?c';
import Kubernetes from './kubernetes.svg?c';

const icons: {
  [key in PlatformType]: SvgrComponent;
} = {
  [PlatformType.Docker]: Docker,
  [PlatformType.Podman]: Podman,
  [PlatformType.Kubernetes]: Kubernetes,
  [PlatformType.Azure]: Azure,
};

export function getPlatformIcon(type: EnvironmentType) {
  const platform = getPlatformType(type);

  return icons[platform];
}
