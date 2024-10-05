import { compact } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { ClusterRoleBinding } from '../types';

import { queryKeys } from './query-keys';

export function useClusterRoleBindings(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => {
      const cluerRoleBindings = await getClusterRoleBindings(environmentId);
      return compact(cluerRoleBindings);
    },
    {
      ...withGlobalError('Unable to get cluster role bindings'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getClusterRoleBindings(environmentId: EnvironmentId) {
  try {
    const { data: roles } = await axios.get<ClusterRoleBinding[]>(
      `kubernetes/${environmentId}/cluster_role_bindings`
    );

    return roles;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get cluster role bindings');
  }
}
