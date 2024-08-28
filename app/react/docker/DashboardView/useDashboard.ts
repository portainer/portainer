import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from '../queries/utils';
import { buildDockerUrl } from '../queries/utils/buildDockerUrl';

interface DashboardResponse {
  containers: {
    total: number;
    running: number;
    stopped: number;
    healthy: number;
    unhealthy: number;
  };
  services: number;
  images: {
    total: number;
    size: number;
  };
  volumes: number;
  networks: number;
  stacks: number;
}

export function useDashboard(envId: EnvironmentId) {
  return useQuery({
    queryFn: async () => {
      try {
        const res = await axios.get<DashboardResponse>(
          buildDockerUrl(envId, 'dashboard')
        );
        return res.data;
      } catch (error) {
        throw parseAxiosError(error);
      }
    },
    queryKey: [...queryKeys.root(envId), 'dashboard'] as const,
  });
}
