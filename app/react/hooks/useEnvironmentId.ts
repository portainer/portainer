import { useCurrentStateAndParams } from '@uirouter/react';

export function useEnvironmentId() {
  const {
    params: { endpointId: environmentId },
  } = useCurrentStateAndParams();

  if (!environmentId) {
    throw new Error('endpointId url param is required');
  }

  return environmentId;
}
