import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'cluster_role_bindings',
    ] as const,
};
