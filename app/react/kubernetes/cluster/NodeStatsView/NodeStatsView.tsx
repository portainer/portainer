import { useCurrentStateAndParams } from '@uirouter/react';
import { useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNodeMetricsQuery } from '@/react/kubernetes/metrics/queries/useNodeMetricsQuery';
import { useNodeQuery } from '@/react/kubernetes/cluster/queries/useNodeQuery';
import { parseCPU } from '@/react/kubernetes/utils';
import { useAggregatedMetrics } from '@/react/kubernetes/metrics/useAggregatedMetrics';
import { MetricsAboutPanel } from '@/react/kubernetes/metrics/MetricsAboutPanel';
import { CpuUsageChart } from '@/react/kubernetes/metrics/charts/CpuUsageChart';
import { MemoryUsageChart } from '@/react/kubernetes/metrics/charts/MemoryUsageChart';

import { Alert } from '@@/Alert';
import { PageHeader } from '@@/PageHeader';

export function NodeStatsView() {
  const environmentId = useEnvironmentId();
  const {
    params: { nodeName },
  } = useCurrentStateAndParams();

  const [refreshRateMS, setRefreshRateMS] = useState(30_000);

  const nodeQuery = useNodeQuery(environmentId, nodeName, {
    select: (node) => parseCPU(node.status?.allocatable?.cpu ?? '') || 1,
  });
  const nodeCPU = nodeQuery.data ?? 1;

  const metricsQuery = useNodeMetricsQuery(nodeName, environmentId, {
    select: (node) => ({
      cpu: node.usage.cpu,
      memory: node.usage.memory,
      timestamp: String(node.metadata.creationTimestamp),
    }),
    refreshRateMS,
  });

  const { chartData, metricsState } = useAggregatedMetrics(
    {
      data: metricsQuery.data,
      error: metricsQuery.isFetchedAfterMount ? metricsQuery.error : undefined,
    },
    nodeCPU
  );

  return (
    <>
      <PageHeader
        title="Node stats"
        breadcrumbs={[
          { label: 'Cluster', link: 'kubernetes.cluster' },
          {
            label: nodeName,
            link: 'kubernetes.cluster.node',
            linkParams: { nodeName },
          },
          nodeName,
        ]}
      />

      <div className="mx-4 mb-4 space-y-4">
        {metricsState === 'unavailable' && (
          <Alert color="warn" title="Unable to retrieve node metrics">
            Portainer was unable to retrieve any metrics associated to that
            node. Please contact your administrator to ensure that the
            Kubernetes metrics feature is properly configured.
          </Alert>
        )}

        {metricsState === 'available' && (
          <>
            <MetricsAboutPanel
              description={
                <>
                  This view displays real-time statistics about the node{' '}
                  <b>{nodeName}</b>.
                </>
              }
              textClassName="text-muted"
              refreshRateMS={refreshRateMS}
              onRefreshRateChange={setRefreshRateMS}
              dataCy="node-stats-refresh-rate"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MemoryUsageChart
                chartData={chartData}
                icon="cpu"
                yAxisDomain={['auto', 'auto']}
              />
              <CpuUsageChart chartData={chartData} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
