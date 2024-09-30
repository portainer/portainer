import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard', 'namespacesCount'] as const,
};

export function useGetNamespacesCountQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getNamespacesCount(environmentId),
    {
      ...withError('Unable to get namespaces count'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getNamespacesCount(environmentId: EnvironmentId) {
  try {
    const { data: namespacesCount } = await axios.get<number>(
      `kubernetes/${environmentId}/namespaces/count`
    );

    return namespacesCount;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
