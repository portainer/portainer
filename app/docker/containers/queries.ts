import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { queryContainers } from './containers.service';

export function useContainers(environmentId: EnvironmentId, filters?: object) {
  return useQuery(
    ['environments', environmentId, 'docker', 'containers', 'filters', filters],
    () => queryContainers(environmentId, filters),
    {
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          'Unable to get containers in network'
        );
      },
    }
  );
}
