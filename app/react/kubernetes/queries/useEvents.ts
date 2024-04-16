import { EventList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../axiosError';

import { queryKeys as environmentQueryKeys } from './query-keys';

type Options = {
  /** if undefined, events are fetched at the cluster scope */
  namespace?: string;
  /** https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors */
  labelSelector?: string;
  /** https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors */
  fieldSelector?: string;
};

const queryKeys = {
  base: (environmentId: number, { namespace, ...params }: Options) => {
    if (namespace) {
      return [
        ...environmentQueryKeys.base(environmentId),
        'events',
        namespace,
        params,
      ];
    }
    return [...environmentQueryKeys.base(environmentId), 'events', params];
  },
};

async function getEvents(environmentId: EnvironmentId, options?: Options) {
  const { namespace, ...params } = options ?? {};
  try {
    const { data } = await axios.get<EventList>(
      namespace
        ? `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/events`
        : `/endpoints/${environmentId}/kubernetes/api/v1/events`,
      {
        params,
      }
    );
    return data.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve events');
  }
}

type QueryOptions = {
  autoRefreshRate?: number;
} & Options;

export function useEvents(
  environmentId: EnvironmentId,
  options?: QueryOptions
) {
  const { autoRefreshRate, labelSelector, fieldSelector, namespace } =
    options ?? {};
  return useQuery(
    queryKeys.base(environmentId, { labelSelector, fieldSelector, namespace }),
    () => getEvents(environmentId, { labelSelector, fieldSelector, namespace }),
    {
      ...withError('Unable to retrieve events'),
      refetchInterval() {
        return autoRefreshRate ?? false;
      },
    }
  );
}
