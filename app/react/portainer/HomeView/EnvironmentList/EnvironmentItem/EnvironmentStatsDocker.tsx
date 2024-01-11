import {
  Box,
  Cpu,
  Database,
  HardDrive,
  Heart,
  Layers,
  List,
  Power,
  Shuffle,
} from 'lucide-react';

import Memory from '@/assets/ico/memory.svg?c';
import { addPlural } from '@/portainer/helpers/strings';
import { DockerSnapshot } from '@/react/docker/snapshots/types';
import { humanize } from '@/portainer/filters/filters';

import { StatsItem } from '@@/StatsItem';

interface Props {
  snapshot?: DockerSnapshot;
}

export function EnvironmentStatsDocker({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <StatsItem
        value={addPlural(snapshot.StackCount, 'stack')}
        icon={Layers}
      />

      {!!snapshot.Swarm && (
        <StatsItem
          value={addPlural(snapshot.ServiceCount, 'service')}
          icon={Shuffle}
        />
      )}

      <ContainerStats
        total={snapshot.ContainerCount}
        running={snapshot.RunningContainerCount}
        stopped={snapshot.StoppedContainerCount}
        healthy={snapshot.HealthyContainerCount}
        unhealthy={snapshot.UnhealthyContainerCount}
      />
      <StatsItem
        value={addPlural(snapshot.VolumeCount, 'volume')}
        icon={Database}
      />
      <StatsItem value={addPlural(snapshot.ImageCount, 'image')} icon={List} />

      <StatsItem icon={Cpu} value={`${snapshot.TotalCPU} CPU`} />

      <StatsItem
        icon={Memory}
        value={`${humanize(snapshot.TotalMemory)} RAM`}
      />

      {snapshot.Swarm && (
        <StatsItem
          value={addPlural(snapshot.NodeCount, 'node')}
          icon={HardDrive}
        />
      )}
    </>
  );
}

interface ContainerStatsProps {
  total: number;
  running: number;
  stopped: number;
  healthy: number;
  unhealthy: number;
}

function ContainerStats({
  total,
  running,
  stopped,
  healthy,
  unhealthy,
}: ContainerStatsProps) {
  const actualTotal = total || running + stopped;
  return (
    <StatsItem value={addPlural(actualTotal, 'container')} icon={Box}>
      {actualTotal > 0 && (
        <>
          <StatsItem value={running} icon={Power} iconClass="icon-success" />
          <StatsItem value={stopped} icon={Power} iconClass="icon-danger" />
          <StatsItem value={healthy} icon={Heart} iconClass="icon-success" />
          <StatsItem value={unhealthy} icon={Heart} iconClass="icon-warning" />
        </>
      )}
    </StatsItem>
  );
}
