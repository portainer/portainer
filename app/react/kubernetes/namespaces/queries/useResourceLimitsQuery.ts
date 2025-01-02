import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifyError } from '@/portainer/services/notifications';
import axios, { parseAxiosError } from '@/portainer/services/axios';

type K8sNodeLimits = {
  CPU: number;
  Memory: number;
};

/**
 * useClusterResourceLimitsQuery is used to retrieve the total resource limits for a cluster, minus the allocated resources taken by existing namespaces
 * @returns the available resource limits for the cluster
 * */
export function useClusterResourceLimitsQuery(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'max_resource_limits'],
    () => getResourceLimits(environmentId),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get resource limits');
      },
    }
  );
}

async function getResourceLimits(environmentId: EnvironmentId) {
  try {
    const { data: limits } = await axios.get<K8sNodeLimits>(
      `/kubernetes/${environmentId}/max_resource_limits`
    );
    return limits;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve resource limits');
  }
}
