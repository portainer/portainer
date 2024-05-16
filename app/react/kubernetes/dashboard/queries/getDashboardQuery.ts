import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { K8sDashboard } from '../types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'dashboard'] as const,
};

export function useGetDashboardQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getDashboard(environmentId),
    {
      ...withError('Unable to get dashboard stats'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getDashboard(environmentId: EnvironmentId) {
  try {
    const { data: dashboard } = await axios.get<K8sDashboard>(
      `kubernetes/${environmentId}/dashboard`
    );

    return dashboard;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to get dashboard stats. Some counts may be inaccurate.'
    );
  }
}
