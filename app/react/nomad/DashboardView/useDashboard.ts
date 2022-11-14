import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

export type DashboardResponse = {
  JobCount: number;
  GroupCount: number;
  TaskCount: number;
  RunningTaskCount: number;
  NodeCount: number;
};

export function useDashboard(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'nomad', 'dashboard'],
    () => getDashboard(environmentId),
    {
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to get dashboard information',
        },
      },
    }
  );
}

export async function getDashboard(environmentId: EnvironmentId) {
  try {
    const { data: dashboard } = await axios.get<DashboardResponse>(
      `/nomad/endpoints/${environmentId}/dashboard`,
      {
        params: {},
      }
    );
    return dashboard;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
