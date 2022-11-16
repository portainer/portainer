import { Cpu, HardDrive } from 'lucide-react';

import {
  EnvironmentType,
  KubernetesSnapshot,
} from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { addPlural } from '@/portainer/helpers/strings';
import Memory from '@/assets/ico/memory.svg?c';

import { AgentVersionTag } from './AgentVersionTag';
import { EnvironmentStatsItem } from './EnvironmentStatsItem';

interface Props {
  snapshots?: KubernetesSnapshot[];
  type: EnvironmentType;
  agentVersion: string;
}

export function EnvironmentStatsKubernetes({
  snapshots = [],
  type,
  agentVersion,
}: Props) {
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
      <span className="blocklist-item-desc space-x-1">
        <EnvironmentStatsItem icon={Cpu} value={`${snapshot.TotalCPU} CPU`} />

        <EnvironmentStatsItem
          icon={Memory}
          value={`${humanize(snapshot.TotalMemory)} RAM`}
        />
      </span>

      <span className="small text-muted space-x-2 vertical-center">
        <span>Kubernetes {snapshot.KubernetesVersion}</span>
        <EnvironmentStatsItem
          value={addPlural(snapshot.NodeCount, 'node')}
          icon={HardDrive}
        />
        <AgentVersionTag type={type} version={agentVersion} />
      </span>
    </div>
  );
}
