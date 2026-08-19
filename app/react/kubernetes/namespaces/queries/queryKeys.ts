import { compact } from 'lodash';

import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  list: (
    environmentId: EnvironmentId,
    options?: { withResourceQuota?: boolean; withUnhealthyEvents?: boolean }
  ) =>
    compact([
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      options?.withResourceQuota,
      options?.withUnhealthyEvents,
    ]),
  namespace: (environmentId: EnvironmentId, namespace: string) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
    ] as const,
  namespaceYAML: (environmentId: EnvironmentId, namespace: string) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'yaml',
    ] as const,
};
