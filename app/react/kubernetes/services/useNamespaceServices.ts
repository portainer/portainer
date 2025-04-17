import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Service } from './types';

export function useNamespaceServices<T = Service[]>(
  environmentId: EnvironmentId,
  namespace: string,
  queryOptions?: UseQueryOptions<Service[], unknown, T>
) {
  return useQuery({
    queryKey: [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'services',
    ],
    queryFn: () => getServices(environmentId, namespace),
    onError: (err) => {
      notifyError('Failure', err as Error, 'Unable to get services');
    },
    ...queryOptions,
  });
}

export async function getServices(
  environmentId: EnvironmentId,
  namespace: string
) {
  if (!namespace) {
    return [];
  }
  try {
    const { data: services } = await axios.get<Service[]>(
      `kubernetes/${environmentId}/namespaces/${namespace}/services`
    );
    return services;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve services');
  }
}
