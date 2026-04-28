import { KubernetesSnapshot } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';

import { CPUStats, MemoryStats, NodeStats } from '@@/StatsItem';

interface Props {
  snapshot?: KubernetesSnapshot;
}

export function EnvironmentStatsKubernetes({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <NodeStats value={snapshot.NodeCount} />

      <CPUStats value={snapshot.TotalCPU} />

      <MemoryStats value={humanize(snapshot.TotalMemory)} />
    </>
  );
}
