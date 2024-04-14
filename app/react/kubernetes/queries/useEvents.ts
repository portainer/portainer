import { EventList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../axiosError';

type Params = {
  labelSelector?: string;
  fieldSelector?: string;
};

async function getEvents(
  environmentId: EnvironmentId,
  namespace?: string,
  params?: Params
) {
  try {
    const { data } = await axios.get<EventList>(
      namespace
        ? `/endpoints/${environmentId}/kubernetes/api/v1/events`
        : `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/events`,
      {
        params,
      }
    );
    return data.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve events');
  }
}

export function useEvents(
  environmentId: EnvironmentId,
  namespace?: string,
  options?: { autoRefreshRate?: number },
  params?: Params
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', namespace, 'events', params],
    () => getEvents(environmentId, namespace, params),
    {
      ...withError('Unable to retrieve events'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}
