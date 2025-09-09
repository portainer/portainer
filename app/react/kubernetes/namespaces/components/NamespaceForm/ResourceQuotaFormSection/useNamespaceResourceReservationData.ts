import { round } from 'lodash';

import { getSafeValue, parseCPU } from '@/react/kubernetes/utils';
import { PodMetrics } from '@/react/kubernetes/metrics/types';
import { useNamespaceMetricsQuery } from '@/react/kubernetes/metrics/queries/useNamespaceMetricsQuery';
import { megaBytesValue } from '@/react/kubernetes/namespaces/resourceQuotaUtils';

import { useResourceQuotaUsed } from './useResourceQuotaUsed';
import { ResourceQuotaFormValues } from './types';

export function useNamespaceResourceReservationData(
  environmentId: number,
  namespaceName: string,
  resourceQuotaValues: ResourceQuotaFormValues
) {
  const { data: quota, isLoading: isQuotaLoading } = useResourceQuotaUsed(
    environmentId,
    namespaceName
  );
  const { data: metrics, isLoading: isMetricsLoading } =
    useNamespaceMetricsQuery(environmentId, namespaceName, {
      select: aggregatePodUsage,
    });

  return {
    cpuLimit: Number(resourceQuotaValues.cpu) || 0,
    memoryLimit: Number(resourceQuotaValues.memory) || 0,
    displayResourceUsage: !!metrics,
    resourceReservation: {
      cpu: getSafeValue(quota?.cpu || 0),
      memory: getSafeValue(quota?.memory || 0),
    },
    resourceUsage: {
      cpu: getSafeValue(metrics?.cpu || 0),
      memory: getSafeValue(metrics?.memory || 0),
    },
    isLoading: isQuotaLoading || isMetricsLoading,
  };
}

/**
 * Aggregates the resource usage of all the containers in the namespace.
 * @param podMetricsList - List of pod metrics
 * @returns Aggregated resource usage. CPU cores are rounded to 3 decimal places. Memory is in MB.
 */
function aggregatePodUsage(podMetricsList: PodMetrics) {
  const containerResourceUsageList = podMetricsList.items.flatMap((i) =>
    i.containers.map((c) => c.usage)
  );
  const namespaceResourceUsage = containerResourceUsageList.reduce(
    (total, usage) => ({
      cpu: total.cpu + parseCPU(usage.cpu),
      memory: total.memory + megaBytesValue(usage.memory),
    }),
    { cpu: 0, memory: 0 }
  );
  namespaceResourceUsage.cpu = round(namespaceResourceUsage.cpu, 3);
  return namespaceResourceUsage;
}
