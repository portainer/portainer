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
  Calculator,
} from 'lucide-react';

import Memory from '@/assets/ico/memory.svg?c';
import { addPlural } from '@/portainer/helpers/strings';
import { DockerSnapshot } from '@/react/docker/snapshots/types';
import { humanize } from '@/portainer/filters/filters';

import { StatsItem } from '@@/StatsItem';

interface Props {
  snapshot?: DockerSnapshot;
  gpus?: [];
}

export function EnvironmentStatsDocker({ snapshot, gpus }: Props) {
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

      <StatsItem icon={Calculator} value={`${gpus?.length} GPU`} />

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
    <StatsItem value={addPlural(containersCount, 'container')} icon={Box}>
      {containersCount > 0 && (
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
