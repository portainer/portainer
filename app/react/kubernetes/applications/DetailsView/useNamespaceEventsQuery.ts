import { EventList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

async function getNamespaceEvents(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<EventList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/events`,
      {
        params: {
          labelSelector,
        },
      }
    );
    return data.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve events');
  }
}

export function useNamespaceEventsQuery(
  environmentId: EnvironmentId,
  namespace: string,
  options?: { autoRefreshRate?: number },
  labelSelector?: string
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'events',
      namespace,
      labelSelector,
    ],
    () => getNamespaceEvents(environmentId, namespace, labelSelector),
    {
      ...withError('Unable to retrieve events'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}
