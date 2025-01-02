import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys as namespaceQueryKeys } from '@/react/kubernetes/namespaces/queries/queryKeys';

export const queryKeys = {
  namespaceMetrics: (environmentId: EnvironmentId, namespaceName: string) => [
    ...namespaceQueryKeys.namespace(environmentId, namespaceName),
    'metrics',
  ],
};
