import { EventList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../axiosError';

import { queryKeys as environmentQueryKeys } from './query-keys';

type RequestOptions = {
  /** if undefined, events are fetched at the cluster scope */
  namespace?: string;
  params?: {
    /** https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors */
    labelSelector?: string;
    /** https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors */
    fieldSelector?: string;
  };
};

const queryKeys = {
  base: (environmentId: number, { namespace, params }: RequestOptions) => {
    if (namespace) {
      return [
        ...environmentQueryKeys.base(environmentId),
        'events',
        namespace,
        params,
      ] as const;
    }
    return [
      ...environmentQueryKeys.base(environmentId),
      'events',
      params,
    ] as const;
  },
};

async function getEvents(
  environmentId: EnvironmentId,
  options?: RequestOptions
) {
  const { namespace, params } = options ?? {};
  try {
    const { data } = await axios.get<EventList>(
      buildUrl(environmentId, namespace),
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
  queryOptions?: {
    autoRefreshRate?: number;
  };
} & RequestOptions;

export function useEvents(
  environmentId: EnvironmentId,
  options?: QueryOptions
) {
  const { queryOptions, params, namespace } = options ?? {};
  return useQuery(
    queryKeys.base(environmentId, { params, namespace }),
    () => getEvents(environmentId, { params, namespace }),
    {
      ...withError('Unable to retrieve events'),
      refetchInterval() {
        return queryOptions?.autoRefreshRate ?? false;
      },
    }
  );
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  return namespace
    ? `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/events`
    : `/endpoints/${environmentId}/kubernetes/api/v1/events`;
}
