import { compact } from 'lodash';

export const queryKeys = {
  list: (environmentId: number, options?: { withResourceQuota?: boolean }) =>
    compact([
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      options?.withResourceQuota,
    ]),
  namespace: (environmentId: number, namespace: string) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
    ] as const,
};
