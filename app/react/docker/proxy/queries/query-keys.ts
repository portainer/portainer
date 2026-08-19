import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [environmentId, 'docker', 'proxy'] as const,
  events: (environmentId: EnvironmentId, params?: object) =>
    [...queryKeys.base(environmentId), 'events', params] as const,
};
