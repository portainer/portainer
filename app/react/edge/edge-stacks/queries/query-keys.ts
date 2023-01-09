import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeStack } from '../types';

export const queryKeys = {
  base: () => ['edge-stacks'] as const,
  item: (id: EdgeStack['Id']) => [...queryKeys.base(), id] as const,
  logsStatus: (edgeStackId: EdgeStack['Id'], environmentId: EnvironmentId) =>
    [...queryKeys.item(edgeStackId), 'logs', environmentId] as const,
};
