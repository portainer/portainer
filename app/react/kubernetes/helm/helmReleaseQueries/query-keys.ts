import { EnvironmentId } from '@/react/portainer/environments/types';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';

import { UpdateHelmReleasePayload } from '../types';

export const queryKeys = {
  // Environment-scoped Helm queries (following kubernetes pattern)
  base: (environmentId: EnvironmentId) =>
    [
      ...environmentQueryKeys.item(environmentId),
      'kubernetes',
      'helm',
    ] as const,

  // Helm releases (environment-specific)
  releases: (environmentId: EnvironmentId) =>
    [...queryKeys.base(environmentId), 'releases'] as const,

  release: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    revision?: number,
    showResources?: boolean
  ) =>
    [
      ...queryKeys.releases(environmentId),
      namespace,
      name,
      revision,
      showResources,
    ] as const,

  releaseHistory: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [...queryKeys.release(environmentId, namespace, name), 'history'] as const,

  // Environment-specific install operations
  installDryRun: (
    environmentId: EnvironmentId,
    payload: UpdateHelmReleasePayload
  ) =>
    [...queryKeys.base(environmentId), 'install', 'dry-run', payload] as const,
};
