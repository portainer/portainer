import { useQuery } from 'react-query';

import { getEndpoint } from '@/react/portainer/environments/environment.service';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

export function useEnvironment<T = Environment | null>(
  id?: EnvironmentId,
  select?: (environment: Environment | null) => T
) {
  return useQuery(['environments', id], () => (id ? getEndpoint(id) : null), {
    select,
    ...withError('Failed loading environment'),
    staleTime: 50,
    enabled: !!id,
  });
}
