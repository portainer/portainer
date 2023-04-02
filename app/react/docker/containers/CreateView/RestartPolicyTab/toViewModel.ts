import { ContainerJSON } from '../../queries/container';

import { RestartPolicy } from './types';

export function toViewModel(config: ContainerJSON): RestartPolicy {
  switch (config.HostConfig?.RestartPolicy?.Name) {
    case 'always':
      return RestartPolicy.Always;
    case 'on-failure':
      return RestartPolicy.OnFailure;
    case 'unless-stopped':
      return RestartPolicy.UnlessStopped;
    case 'no':
    default:
      return RestartPolicy.No;
  }
}

export function getDefaultViewModel(): RestartPolicy {
  return RestartPolicy.No;
}
