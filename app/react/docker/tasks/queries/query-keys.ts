import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    [dockerQueryKeys.root(environmentId), 'tasks'] as const,

  task: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.list(environmentId), id] as const,
};
