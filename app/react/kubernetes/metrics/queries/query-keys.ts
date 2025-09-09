import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys as namespaceQueryKeys } from '@/react/kubernetes/namespaces/queries/queryKeys';
import { queryKeys as nodeQueryKeys } from '@/react/kubernetes/cluster/queries/query-keys';

export const queryKeys = {
  namespaceMetrics: (environmentId: EnvironmentId, namespaceName: string) => [
    ...namespaceQueryKeys.namespace(environmentId, namespaceName),
    'metrics',
  ],
  nodeMetrics: (environmentId: EnvironmentId, nodeName: string) => [
    ...nodeQueryKeys.node(environmentId, nodeName),
    'metrics',
  ],
  applicationMetrics: (environmentId: EnvironmentId, nodeName?: string) => [
    environmentId,
    'kubernetes',
    'metrics',
    'applications',
    nodeName,
  ],
};
