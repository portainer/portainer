import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  root: (environmentId: EnvironmentId) => ['docker', environmentId] as const,
};
