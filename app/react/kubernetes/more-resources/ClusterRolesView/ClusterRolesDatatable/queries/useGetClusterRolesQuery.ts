import { compact } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { ClusterRole } from '../types';

import { queryKeys } from './query-keys';

export function useGetClusterRolesQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => {
      const clusterRoles = await getClusterRoles(environmentId);
      return compact(clusterRoles);
    },
    {
      ...withError('Unable to get cluster roles'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getClusterRoles(environmentId: EnvironmentId) {
  try {
    const { data: roles } = await axios.get<ClusterRole[]>(
      `kubernetes/${environmentId}/cluster_roles`
    );

    return roles;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get cluster roles');
  }
}
