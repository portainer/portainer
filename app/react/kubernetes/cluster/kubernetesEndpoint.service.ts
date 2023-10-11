import { EndpointsList } from 'kubernetes-types/core/v1';
import { useQuery } from 'react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

async function getKubernetesEndpoints(environmentId: EnvironmentId) {
  const { data: endpointsList } = await axios.get<EndpointsList>(
    `/endpoints/${environmentId}/kubernetes/api/v1/endpoints`
  );
  return endpointsList.items;
}

export function useKubernetesEndpointsQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'endpoints'],
    () => getKubernetesEndpoints(environmentId),
    {
      ...withError('Unable to retrieve Kubernetes endpoints'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}
