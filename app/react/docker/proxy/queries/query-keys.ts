import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [environmentId, 'docker', 'proxy'] as const,
};
