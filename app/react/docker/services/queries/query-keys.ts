import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';
import { Filters } from '../types';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'services'] as const,

  filters: (environmentId: EnvironmentId, filters: Filters = {}) =>
    [...queryKeys.list(environmentId), filters] as const,

  service: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.list(environmentId), id] as const,
};
