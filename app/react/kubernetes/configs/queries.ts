import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { getConfigMaps } from './service';

export function useConfigurations(
  environmentId: EnvironmentId,
  namespace?: string
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'configurations',
    ],
    () => (namespace ? getConfigMaps(environmentId, namespace) : []),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get configurations');
      },
      enabled: !!namespace,
    }
  );
}
