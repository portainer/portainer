import { type ReactElement } from 'react';

import { EnvironmentHealth } from '@/react/portainer/environments/types';
import { IconSize } from '@/react/portainer/environments/utils/index';

export const IconSizeClass: Record<IconSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

export function getHealthIcon(
  healthStatus: EnvironmentHealth,
  size: IconSize
): ReactElement {
  const dotClass = `block rounded-full ${IconSizeClass[size]}`;
  const icons: Record<EnvironmentHealth, ReactElement> = {
    [EnvironmentHealth.Up]: (
      <span aria-hidden="true" className={`${dotClass} bg-success-7`} />
    ),
    [EnvironmentHealth.Down]: (
      <span aria-hidden="true" className={`${dotClass} bg-error-7`} />
    ),
    [EnvironmentHealth.Outdated]: (
      <span aria-hidden="true" className={`${dotClass} bg-warning-7`} />
    ),
    [EnvironmentHealth.Heartbeat]: (
      <span
        aria-hidden="true"
        className={`${dotClass} animate-pulse bg-success-7`}
      />
    ),
  };

  return icons[healthStatus];
}
