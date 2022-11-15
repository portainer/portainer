import {
  Layers,
  Shuffle,
  Database,
  List,
  HardDrive,
  Box,
  Power,
  Heart,
} from 'react-feather';

import {
  DockerSnapshot,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { addPlural } from '@/portainer/helpers/strings';

import { AgentVersionTag } from './AgentVersionTag';
import { EnvironmentStatsItem } from './EnvironmentStatsItem';

interface Props {
  snapshots: DockerSnapshot[];
  type: EnvironmentType;
  agentVersion: string;
}

export function EnvironmentStatsDocker({
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
      <span className="blocklist-item-desc">
        <EnvironmentStatsItem
          value={addPlural(snapshot.StackCount, 'stack')}
          icon={Layers}
        />

        {!!snapshot.Swarm && (
          <EnvironmentStatsItem
            value={addPlural(snapshot.ServiceCount, 'service')}
            icon={Shuffle}
          />
        )}

        <ContainerStats
          running={snapshot.RunningContainerCount}
          stopped={snapshot.StoppedContainerCount}
          healthy={snapshot.HealthyContainerCount}
          unhealthy={snapshot.UnhealthyContainerCount}
        />
        <EnvironmentStatsItem
          value={addPlural(snapshot.VolumeCount, 'volume')}
          icon={Database}
        />
        <EnvironmentStatsItem
          value={addPlural(snapshot.ImageCount, 'image')}
          icon={List}
        />
      </span>

      <span className="small text-muted space-x-2 vertical-center">
        <span>
          {snapshot.Swarm ? 'Swarm' : 'Standalone'} {snapshot.DockerVersion}
        </span>
        {snapshot.Swarm && (
          <EnvironmentStatsItem
            value={addPlural(snapshot.NodeCount, 'node')}
            icon={HardDrive}
          />
        )}
        <AgentVersionTag version={agentVersion} type={type} />
      </span>
    </div>
  );
}

interface ContainerStatsProps {
  running: number;
  stopped: number;
  healthy: number;
  unhealthy: number;
}

function ContainerStats({
  running,
  stopped,
  healthy,
  unhealthy,
}: ContainerStatsProps) {
  const containersCount = running + stopped;

  return (
    <EnvironmentStatsItem
      value={addPlural(containersCount, 'container')}
      icon={Box}
    >
      {containersCount > 0 && (
        <span className="space-x-2 space-right">
          <EnvironmentStatsItem
            value={running}
            icon={Power}
            iconClass="icon-success"
          />
          <EnvironmentStatsItem
            value={stopped}
            icon={Power}
            iconClass="icon-danger"
          />
          <EnvironmentStatsItem
            value={healthy}
            icon={Heart}
            iconClass="icon-success"
          />
          <EnvironmentStatsItem
            value={unhealthy}
            icon={Heart}
            iconClass="icon-warning"
          />
        </span>
      )}
    </EnvironmentStatsItem>
  );
}
