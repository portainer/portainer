import { KubernetesSnapshot } from '@/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { addPlural } from '@/portainer/helpers/strings';

import { Stat } from './EnvironmentStatsItem';

interface Props {
  snapshots?: KubernetesSnapshot[];
}

export function EnvironmentStatsKubernetes({ snapshots = [] }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="blocklist-item-line endpoint-item">
        <span className="blocklist-item-desc">No snapshot available</span>
      </div>
    );
  }

  const snapshot = snapshots[0];

  return (
    <div className="blocklist-item-line endpoint-item">
      <span className="blocklist-item-desc space-x-4">
        <Stat icon="fa-microchip" value={`${snapshot.TotalCPU} CPU`} />
        <Stat
          icon="fa-memory"
          value={`${humanize(snapshot.TotalMemory)} RAM`}
        />
      </span>

      <span className="small text-muted space-x-3">
        <span>Kubernetes {snapshot.KubernetesVersion}</span>
        <Stat value={addPlural(snapshot.NodeCount, 'node')} icon="fa-hdd" />
      </span>
    </div>
  );
}
