import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { RoleBinding } from '../types';

import { queryKeys } from './query-keys';

export function useRoleBindings(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllRoleBindings(environmentId),
    {
      ...withGlobalError('Unable to get role bindings'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      enabled: options?.enabled,
    }
  );
}

async function getAllRoleBindings(environmentId: EnvironmentId) {
  try {
    const { data: roleBinding } = await axios.get<RoleBinding[]>(
      `kubernetes/${environmentId}/role_bindings`
    );

    return roleBinding;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get role bindings');
  }
}
