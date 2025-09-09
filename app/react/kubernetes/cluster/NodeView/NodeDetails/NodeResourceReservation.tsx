import { Node } from 'kubernetes-types/core/v1';

import { ResourceReservation } from '@/react/kubernetes/components/ResourceReservation';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useNodeMetricsQuery } from '@/react/kubernetes/metrics/queries/useNodeMetricsQuery';
import { useMetricsForApplicationsQuery } from '@/react/kubernetes/metrics/queries/useMetricsForApplications';
import {
  ApplicationResource,
  NodeMetric,
} from '@/react/kubernetes/metrics/types';
import {
  getMebibytes,
  parseCPU,
  safeFilesizeParser,
} from '@/react/kubernetes/utils';

export function NodeResourceReservation({
  node,
  nodeName,
  environmentId,
}: {
  node: Node;
  nodeName: string;
  environmentId: EnvironmentId;
}) {
  const nodeMetricsQuery = useNodeMetricsQuery(nodeName, environmentId, {
    select: parseNodeMetrics,
    // avoid repeat queries for when the metrics server is not available
    retry: false,
  });
  const applicationsMetricsQuery = useMetricsForApplicationsQuery(
    environmentId,
    nodeName,
    {
      select: parseApplicationMetrics,
    }
  );

  const memoryUsed = nodeMetricsQuery.data?.memoryUsed ?? 0;
  const cpuUsed = nodeMetricsQuery.data?.cpuUsed ?? 0;
  const memoryReservation = applicationsMetricsQuery.data?.memoryRequested ?? 0;
  const cpuReservation = applicationsMetricsQuery.data?.cpuRequested ?? 0;
  const memoryAvailable = getMebibytes(
    safeFilesizeParser(node.status?.allocatable?.memory ?? 0)
  );
  const cpuAvailable = parseCPU(node.status?.allocatable?.cpu ?? '');

  return (
    <ResourceReservation
      displayResourceUsage={!!nodeMetricsQuery.data}
      resourceReservation={{
        cpu: cpuReservation,
        memory: memoryReservation,
      }}
      resourceUsage={{
        cpu: cpuUsed,
        memory: memoryUsed,
      }}
      cpuLimit={cpuAvailable}
      memoryLimit={memoryAvailable}
      memoryUnit="MiB"
      description="Resource reservation represents the total amount of resource assigned to all the applications running on this node."
    />
  );
}

function parseNodeMetrics(nodeMetrics: NodeMetric) {
  return {
    memoryUsed: getMebibytes(safeFilesizeParser(nodeMetrics?.usage?.memory)),
    cpuUsed: parseCPU(nodeMetrics?.usage?.cpu),
  };
}

function parseApplicationMetrics(applicationMetrics: ApplicationResource) {
  return {
    memoryRequested: getMebibytes(applicationMetrics?.MemoryRequest),
    cpuRequested: applicationMetrics?.CpuRequest,
  };
}
