import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { PortainerNamespace } from '../types';

import { queryKeys } from './queryKeys';

export function useNamespacesQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; withResourceQuota?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId, {
      withResourceQuota: !!options?.withResourceQuota,
    }),
    async () => getNamespaces(environmentId, options?.withResourceQuota),
    {
      ...withGlobalError('Unable to get namespaces.'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// getNamespaces is used to retrieve namespaces using the Portainer backend with caching
export async function getNamespaces(
  environmentId: EnvironmentId,
  withResourceQuota?: boolean
) {
  const params = withResourceQuota ? { withResourceQuota } : {};
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
