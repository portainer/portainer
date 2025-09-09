import { round, reduce } from 'lodash';
import filesizeParser from 'filesize-parser';
import { useQuery } from '@tanstack/react-query';
import { Node } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';
import { getMebibytes, parseCPU } from '@/react/kubernetes/utils';

import { getNodes } from '../../queries/useNodesQuery';

export function useClusterResourceLimitsQuery(environmentId: EnvironmentId) {
  return useQuery(
    [environmentId, 'clusterResourceLimits'],
    async () => getNodes(environmentId),
    {
      ...withGlobalError('Unable to retrieve resource limit data', 'Failure'),
      enabled: !!environmentId,
      select: aggregateResourceLimits,
    }
  );
}

/**
 * Processes node data to calculate total CPU and memory limits for the cluster
 * and sets the state for memory limit in MB and CPU limit rounded to 3 decimal places.
 */
function aggregateResourceLimits(nodes: Node[]) {
  const processedNodes = nodes.map((node) => ({
    ...node,
    memory: filesizeParser(node.status?.allocatable?.memory ?? ''),
    cpu: parseCPU(node.status?.allocatable?.cpu ?? ''),
  }));

  return {
    nodes: processedNodes,
    memoryLimit: reduce(
      processedNodes,
      (acc, node) => getMebibytes(node.memory || 0) + acc,
      0
    ),
    cpuLimit: round(
      reduce(processedNodes, (acc, node) => (node.cpu || 0) + acc, 0),
      3
    ),
  };
}
