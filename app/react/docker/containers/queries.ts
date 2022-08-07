import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';

import { Filters, getContainers } from './containers.service';

export function useContainers(
  environmentId: EnvironmentId,
  all = true,
  filters?: Filters,
  autoRefreshRate?: number
) {
  return useQuery(
    ['environments', environmentId, 'docker', 'containers', { all, filters }],
    () => getContainers(environmentId, all, filters),
    {
      meta: {
        title: 'Failure',
        message: 'Unable to retrieve containers',
      },
      refetchInterval() {
        return autoRefreshRate ?? false;
      },
    }
  );
}
