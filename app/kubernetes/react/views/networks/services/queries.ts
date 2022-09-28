import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { getServices } from './service';
import { Service } from './types';

export function useServices(environmentId: EnvironmentId, namespace: string) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'services',
    ],
    () =>
      namespace ? getServices(environmentId, namespace) : ([] as Service[]),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get services');
      },
    }
  );
}
