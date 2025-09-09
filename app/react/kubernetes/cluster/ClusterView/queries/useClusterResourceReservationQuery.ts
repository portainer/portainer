import { useQuery } from '@tanstack/react-query';
import { Node } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { getTotalResourcesForAllApplications } from '@/react/kubernetes/metrics/queries/useMetricsForApplications';
import { getMebibytes, safeFilesizeParser } from '@/react/kubernetes/utils';

export function useClusterResourceReservationQuery(
  environmentId: EnvironmentId,
  nodes: Node[]
) {
  return useQuery(
    [environmentId, 'clusterResourceReservation'],
    () => getTotalResourcesForAllApplications(environmentId),
    {
      enabled: !!environmentId && nodes.length > 0,
      select: (data) => ({
        cpu: data.CpuRequest,
        // MemoryRequest may be a string like "2Gi"; convert to bytes first
        memory: getMebibytes(
          typeof data.MemoryRequest === 'number'
            ? data.MemoryRequest
            : safeFilesizeParser(data.MemoryRequest)
        ),
      }),
    }
  );
}
