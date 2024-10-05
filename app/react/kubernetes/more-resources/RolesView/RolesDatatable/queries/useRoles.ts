import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Role } from '../types';

const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'roles'] as const,
};

export function useRoles(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; enabled?: boolean }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllRoles(environmentId),
    {
      ...withGlobalError('Unable to get roles'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      enabled: options?.enabled,
    }
  );
}

async function getAllRoles(environmentId: EnvironmentId) {
  try {
    const { data: roles } = await axios.get<Role[]>(
      `kubernetes/${environmentId}/roles`
    );

    return roles;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get roles');
  }
}
