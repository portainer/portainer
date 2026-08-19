import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { PortainerNamespace } from '../types';

import { queryKeys } from './queryKeys';

export function useNamespacesQuery<T = PortainerNamespace[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    withResourceQuota?: boolean;
    withUnhealthyEvents?: boolean;
    select?: (namespaces: PortainerNamespace[]) => T;
  }
) {
  return useQuery(
    queryKeys.list(environmentId, {
      withResourceQuota: !!options?.withResourceQuota,
      withUnhealthyEvents: !!options?.withUnhealthyEvents,
    }),
    async () =>
      getNamespaces(
        environmentId,
        options?.withResourceQuota,
        options?.withUnhealthyEvents
      ),
    {
      ...withError('Unable to get namespaces.'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      select: options?.select,
    }
  );
}

// getNamespaces is used to retrieve namespaces using the Portainer backend with caching
export async function getNamespaces(
  environmentId: EnvironmentId,
  withResourceQuota?: boolean,
  withUnhealthyEvents?: boolean
) {
  const params = {
    withResourceQuota,
    withUnhealthyEvents,
  };
  try {
    const { data: namespaces } = await axios.get<PortainerNamespace[]>(
      `kubernetes/${environmentId}/namespaces`,
      { params }
    );
    return namespaces;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve namespaces');
  }
}
