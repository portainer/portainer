import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

import { Filters } from './types';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    [dockerQueryKeys.root(environmentId), 'containers'] as const,

  filters: (
    environmentId: EnvironmentId,
    params: { all?: boolean; filters?: Filters; nodeName?: string } = {}
  ) => [...queryKeys.list(environmentId), params] as const,

  container: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.list(environmentId), id] as const,

  gpus: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.container(environmentId, id), 'gpus'] as const,
};
