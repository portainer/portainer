import { EnvironmentId } from '@/portainer/environments/types';

export const queryKeys = {
  root: (environmentId: EnvironmentId) => ['docker', environmentId] as const,
};
