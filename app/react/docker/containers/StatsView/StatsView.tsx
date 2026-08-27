import { useCurrentStateAndParams } from '@uirouter/react';
import { useState } from 'react';

import { trimContainerName } from '@/docker/filters/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Alert } from '@@/Alert';
import { PageHeader } from '@@/PageHeader';

import {
  useContainer,
  ContainerDetailsResponse,
} from '../queries/useContainer';

import { AboutStatsPanel } from './AboutStatsPanel';
import { CpuUsageChart } from './charts/CpuUsageChart';
import { IoUsageChart } from './charts/IoUsageChart';
import { MemoryUsageChart } from './charts/MemoryUsageChart';
import { NetworkUsageChart } from './charts/NetworkUsageChart';
import { ProcessesDatatable } from './ProcessesDatatable';
import { useAggregatedStats } from './useAggregatedStats';

export function StatsView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id: containerId, nodeName },
  } = useCurrentStateAndParams();

  const [refreshRateMS, setRefreshRateMS] = useState(5000);

  const containerQuery = useContainer<ContainerDetailsResponse>({
    environmentId,
    containerId,
    nodeName,
  });
  const containerName = trimContainerName(containerQuery.data?.Name);

  const { chartData, networkUnavailable, ioUnavailable, error } =
    useAggregatedStats(environmentId, containerId, nodeName, refreshRateMS);

  return (
    <>
      <PageHeader
        title="Container statistics"
        breadcrumbs={[
          { label: 'Containers', link: 'docker.containers' },
          {
            label: containerName || containerId,
            link: 'docker.containers.container',
            linkParams: { id: containerId },
          },
          'Stats',
        ]}
      />

      <div className="mx-4 mb-4 space-y-4">
        <AboutStatsPanel
          containerName={containerName}
          refreshRateMS={refreshRateMS}
          onRefreshRateChange={setRefreshRateMS}
          networkUnavailable={networkUnavailable}
          ioUnavailable={ioUnavailable}
        />
        {error && (
          <Alert color="error" title="Unable to retrieve container statistics">
            {error instanceof Error
              ? error.message
              : 'Unable to retrieve container statistics'}
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MemoryUsageChart chartData={chartData} />
          <CpuUsageChart chartData={chartData} />
          {!networkUnavailable && <NetworkUsageChart chartData={chartData} />}
          {!ioUnavailable && <IoUsageChart chartData={chartData} />}
        </div>
      </div>

      <ProcessesDatatable />
    </>
  );
}
