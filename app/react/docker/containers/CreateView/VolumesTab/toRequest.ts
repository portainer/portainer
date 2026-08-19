import { CreateContainerRequest } from '../types';

import { Values } from './types';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values
): CreateContainerRequest {
  const validValues = values.filter(
    (volume) => volume.containerPath && volume.name
  );

  const volumes = Object.fromEntries(
    validValues.map((volume) => [volume.containerPath, {}])
  );
  const binds = validValues.map((volume) => {
    let bind = `${volume.name}:${volume.containerPath}`;
    if (volume.readOnly) {
      bind += ':ro';
    }

    return bind;
  });

  return {
    ...oldConfig,
    Volumes: volumes,
    HostConfig: {
      ...oldConfig.HostConfig,
      Binds: binds,
    },
  };
}
