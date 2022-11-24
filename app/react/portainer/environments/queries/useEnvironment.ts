import { useQuery } from 'react-query';

import { getEndpoint } from '@/react/portainer/environments/environment.service';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

export function useEnvironment(id?: EnvironmentId) {
  return useQuery(['environments', id], () => (id ? getEndpoint(id) : null), {
    ...withError('Failed loading environment'),
    staleTime: 50,
    enabled: !!id,
  });
}
