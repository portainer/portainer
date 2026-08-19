import { EnvironmentId } from '@/react/portainer/environments/types';
import { COMPOSE_STACK_NAME_LABEL } from '@/react/constants';

import { useContainers } from '../../containers/queries/useContainers';

export function useComposeStackContainers(
  {
    environmentId,
    stackName,
  }: { environmentId: EnvironmentId | undefined; stackName: string },
  {
    autoRefreshRate,
    enabled,
  }: { autoRefreshRate?: number; enabled?: boolean } = {}
) {
  return useContainers(environmentId, {
    filters: {
      label: [`${COMPOSE_STACK_NAME_LABEL}=${stackName}`],
    },
    autoRefreshRate,
    enabled,
  });
}
