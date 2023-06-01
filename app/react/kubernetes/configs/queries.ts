import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';

import { getConfigurations, getConfigMapsForCluster } from './service';

// returns a usequery hook for the formatted list of configmaps and secrets
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
    () => (namespace ? getConfigurations(environmentId, namespace) : []),
    {
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          `Unable to get configurations for namespace ${namespace}`
        );
      },
      enabled: !!namespace,
    }
  );
}

export function useConfigurationsForCluster(
  environemtId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    ['environments', environemtId, 'kubernetes', 'configurations'],
    () => namespaces && getConfigMapsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve configurations for cluster'),
      enabled: !!namespaces,
    }
  );
}
