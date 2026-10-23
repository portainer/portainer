import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  volumes: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'volumes',
  ],
  claims: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'claims',
  ],
  storages: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'storages',
  ],
};
