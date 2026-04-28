import {
  getPlatformType,
  IconSize,
  IconSizeClass,
} from '@/react/portainer/environments/utils';
import {
  ContainerEngine,
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

export function getPlatformIconByEnvironment(
  type: EnvironmentType,
  containerEngine?: ContainerEngine
) {
  const platform = getPlatformType(type, containerEngine);

  return icons[platform];
}

export function getPlatformIconByPlatform(
  platform: PlatformType,
  size?: IconSize
) {
  const platformName = PlatformType[platform];
  const BaseIcon = icons[platform];

  return (
    <BaseIcon
      className={size !== undefined ? IconSizeClass[size] : undefined}
      role="img"
      aria-label={platformName}
    />
  );
}
