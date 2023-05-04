import { useCurrentStateAndParams } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';

export function useEnvironmentId(force = true): EnvironmentId {
  const {
    params: { endpointId: environmentId },
  } = useCurrentStateAndParams();

  if (!environmentId) {
    if (!force) {
      return 0;
    }

    throw new Error('endpointId url param is required');
  }

  return parseInt(environmentId, 10);
}
