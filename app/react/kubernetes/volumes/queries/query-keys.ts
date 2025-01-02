import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  volumes: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'volumes',
  ],
  storages: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'storages',
  ],
};
