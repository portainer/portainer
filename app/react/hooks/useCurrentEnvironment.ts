import { useEnvironment } from '@/react/portainer/environments/queries/useEnvironment';

import { useEnvironmentId } from './useEnvironmentId';

export function useCurrentEnvironment() {
  const id = useEnvironmentId();
  return useEnvironment(id);
}
