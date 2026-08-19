import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as proxyQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...proxyQueryKeys.base(environmentId), 'nodes'] as const,
};
