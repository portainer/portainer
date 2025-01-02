import { EnvironmentId } from '@/react/portainer/environments/types';

import { ConfigMapQueryParams, SecretQueryParams } from './types';

export const configMapQueryKeys = {
  configMap: (
    environmentId: EnvironmentId,
    namespace: string,
    configMap: string
  ) => [
    'environments',
    environmentId,
    'kubernetes',
    'configmaps',
    'namespaces',
    namespace,
    configMap,
  ],
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
  secretsForCluster: (
    environmentId: EnvironmentId,
    params?: SecretQueryParams
  ) =>
    params
      ? ['environments', environmentId, 'kubernetes', 'secrets', params]
      : ['environments', environmentId, 'kubernetes', 'secrets'],
};
