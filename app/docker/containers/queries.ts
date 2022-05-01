import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';

import { getContainers, Filters } from './containers.service';

export function useContainers(environmentId: EnvironmentId, filters?: Filters) {
  return useQuery(
    ['environments', environmentId, 'docker', 'containers', { filters }],
    () => getContainers(environmentId, filters),
    {
      meta: {
        title: 'Failure',
        message: 'Unable to get containers in network',
      },
    }
  );
}
