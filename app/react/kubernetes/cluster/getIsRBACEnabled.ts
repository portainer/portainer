import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

export function useIsRBACEnabledQuery(environmentId: EnvironmentId) {
  return useQuery<boolean, Error>(
    ['environments', environmentId, 'rbacEnabled'],
    () => getIsRBACEnabled(environmentId),
    {
      enabled: !!environmentId,
      ...withError('Unable to check if RBAC is enabled.'),
    }
  );
}

export async function getIsRBACEnabled(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<boolean>(
      `kubernetes/${environmentId}/rbac_enabled`
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to check if RBAC is enabled.');
  }
}
