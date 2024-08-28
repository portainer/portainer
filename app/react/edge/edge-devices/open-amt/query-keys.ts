import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) => ['open-amt', environmentId] as const,
  devices: (environmentId: EnvironmentId) =>
    [...queryKeys.base(environmentId), 'devices'] as const,
  info: (environmentId: EnvironmentId) =>
    [...queryKeys.base(environmentId), 'info'] as const,
};
