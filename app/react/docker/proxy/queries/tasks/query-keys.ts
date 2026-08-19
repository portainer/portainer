import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as proxyQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...proxyQueryKeys.base(environmentId), 'tasks'] as const,
  list: (environmentId: EnvironmentId, params?: unknown) =>
    [...queryKeys.base(environmentId), params] as const,
};
