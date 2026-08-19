import { useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { getSafeValue } from '@/react/kubernetes/utils';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import {
  useClusterResourceLimitsQuery,
  useClusterResourceReservationQuery,
  useClusterResourceUsageQuery,
} from './queries';

export function useClusterResourceReservationData() {
  const { data: environment } = useCurrentEnvironment();
  const environmentId = useEnvironmentId();

  // Check if server metrics is enabled
  const serverMetricsEnabled =
    environment?.Kubernetes?.Configuration?.UseServerMetrics || false;

  // User needs to have K8sClusterNodeR authorization to view resource usage data
  const { authorized: hasK8sClusterNodeR } = useAuthorizations(
    ['K8sClusterNodeR'],
    undefined,
    true
  );

  // Get resource limits for the cluster
  const { data: resourceLimits, isLoading: isResourceLimitLoading } =
    useClusterResourceLimitsQuery(environmentId);

  // Get resource reservation info for the cluster
  const {
    data: resourceReservation,
    isFetching: isResourceReservationLoading,
  } = useClusterResourceReservationQuery(
    environmentId,
    resourceLimits?.nodes || []
  );

  // Get resource usage info for the cluster
  const {
    data: resourceUsage,
    isFetching: isResourceUsageLoading,
    isError: isResourceUsageError,
  } = useClusterResourceUsageQuery(
    environmentId,
    serverMetricsEnabled,
    hasK8sClusterNodeR,
    resourceLimits?.nodes || []
  );

  return {
    memoryLimit: getSafeValue(resourceLimits?.memoryLimit || 0),
    cpuLimit: getSafeValue(resourceLimits?.cpuLimit || 0),
    displayResourceUsage: hasK8sClusterNodeR && serverMetricsEnabled,
    resourceUsage: {
      cpu: getSafeValue(resourceUsage?.cpu || 0),
      memory: getSafeValue(resourceUsage?.memory || 0),
    },
    resourceReservation: {
      cpu: getSafeValue(resourceReservation?.cpu || 0),
      memory: getSafeValue(resourceReservation?.memory || 0),
    },
    isLoading:
      isResourceLimitLoading ||
      isResourceReservationLoading ||
      isResourceUsageLoading,
    // Display warning if server metrics isn't responding but should be
    displayWarning:
      hasK8sClusterNodeR && serverMetricsEnabled && isResourceUsageError,
  };
}
