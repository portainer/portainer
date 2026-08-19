import { KubernetesSnapshot } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';

import { CPUStats, GpuStats, MemoryStats, NodeStats } from '@@/StatsItem';

interface Props {
  snapshot?: KubernetesSnapshot;
}

export function EnvironmentStatsKubernetes({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  const totalGpuCount = Object.values(snapshot.TotalGPU ?? {}).reduce(
    (sum, v) => sum + v,
    0
  );

  return (
    <>
      {totalGpuCount > 0 && <GpuStats value={totalGpuCount} />}

      <NodeStats value={snapshot.NodeCount} />

      <CPUStats value={snapshot.TotalCPU} />

      <MemoryStats value={humanize(snapshot.TotalMemory)} />
    </>
  );
}
