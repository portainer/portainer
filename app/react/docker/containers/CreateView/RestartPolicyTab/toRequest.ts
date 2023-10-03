import { CreateContainerRequest } from '../types';

import { RestartPolicy } from './types';

export function toRequest(
  config: CreateContainerRequest,
  value: RestartPolicy
): CreateContainerRequest {
  return {
    ...config,
    HostConfig: {
      ...config.HostConfig,
      RestartPolicy: {
        ...config.HostConfig.RestartPolicy,
        Name: value,
      },
    },
  };
}
