import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard', 'configMapsCount'] as const,
};

export function useGetConfigMapsCountQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getConfigMapsCount(environmentId),
    {
      ...withError('Unable to get applications count'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getConfigMapsCount(environmentId: EnvironmentId) {
  try {
    const { data: configMapsCount } = await axios.get<number>(
      `kubernetes/${environmentId}/configmaps/count`
    );

    return configMapsCount;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
