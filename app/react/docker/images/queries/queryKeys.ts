import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [dockerQueryKeys.root(environmentId), 'images'] as const,
  list: (environmentId: EnvironmentId) => queryKeys.base(environmentId),
};
