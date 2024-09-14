import { EnvironmentId } from '@/react/portainer/environments/types';

import { ConfigMapQueryParams } from './types';

export const configMapQueryKeys = {
  configMaps: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'configmaps',
    'namespaces',
    namespace,
  ],
  configMapsForCluster: (
    environmentId: EnvironmentId,
    params?: ConfigMapQueryParams
  ) =>
    params
      ? ['environments', environmentId, 'kubernetes', 'configmaps', params]
      : ['environments', environmentId, 'kubernetes', 'configmaps'],
};

export const secretQueryKeys = {
  secrets: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'secrets',
    'namespaces',
    namespace,
  ],
  secretsForCluster: (environmentId: EnvironmentId, withSystem?: boolean) =>
    withSystem
      ? ['environments', environmentId, 'kubernetes', 'secrets', withSystem]
      : ['environments', environmentId, 'kubernetes', 'secrets'],
};