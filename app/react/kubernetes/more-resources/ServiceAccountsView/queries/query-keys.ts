import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'serviceaccounts'] as const,
  detail: (environmentId: EnvironmentId, namespace: string, name: string) =>
    [queryKeys.base(environmentId), namespace, name] as const,
  yaml: (environmentId: EnvironmentId, namespace: string, name: string) =>
    [queryKeys.base(environmentId), namespace, name, 'yaml'] as const,
};
