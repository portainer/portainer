import { useQuery } from '@tanstack/react-query';
import { Node } from 'kubernetes-types/core/v1';
import filesizeParser from 'filesize-parser';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { getMetricsForAllNodes } from '@/react/kubernetes/metrics/metrics';
import { withGlobalError } from '@/react-tools/react-query';
import { NodeMetrics } from '@/react/kubernetes/metrics/types';
import { getMebibytes, parseCPU } from '@/react/kubernetes/utils';

export function useClusterResourceUsageQuery(
  environmentId: EnvironmentId,
  serverMetricsEnabled: boolean,
  authorized: boolean,
  nodes: Node[]
) {
  return useQuery(
    [environmentId, 'clusterResourceUsage'],
    () => getMetricsForAllNodes(environmentId),
    {
      enabled:
        authorized &&
        serverMetricsEnabled &&
        !!environmentId &&
        nodes.length > 0,
      select: aggregateResourceUsage,
      ...withGlobalError('Unable to retrieve resource usage data.', 'Failure'),
    }
  );
}

function aggregateResourceUsage(data: NodeMetrics) {
  return data.items.reduce(
    (total, item) => ({
      cpu: total.cpu + parseCPU(item.usage.cpu),
      // item.usage.memory is a string with a KiB unit. Get the bytes then the MiB
      memory: total.memory + getMebibytes(filesizeParser(item.usage.memory)),
    }),
    {
      cpu: 0,
      memory: 0,
    }
  );
}
