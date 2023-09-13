import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

import { NetworksQuery } from './types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'networks'] as const,
  list: (environmentId: EnvironmentId, query: NetworksQuery) =>
    [...queryKeys.base(environmentId), 'list', query] as const,
};
