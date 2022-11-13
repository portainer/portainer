import { addPlural } from '@/portainer/helpers/strings';
import { DockerSnapshot } from '@/react/docker/snapshots/types';

import { EnvironmentStatsItem } from '@@/EnvironmentStatsItem';

interface Props {
  snapshot?: DockerSnapshot;
}

export function EnvironmentStatsDocker({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <EnvironmentStatsItem
        value={addPlural(snapshot.StackCount, 'stack')}
        icon="layers"
        featherIcon
      />

      {!!snapshot.Swarm && (
        <EnvironmentStatsItem
          value={addPlural(snapshot.ServiceCount, 'service')}
          icon="shuffle"
          featherIcon
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
        icon="database"
        featherIcon
      />
      <EnvironmentStatsItem
        value={addPlural(snapshot.ImageCount, 'image')}
        icon="list"
        featherIcon
      />

      {snapshot.Swarm && (
        <EnvironmentStatsItem
          value={addPlural(snapshot.NodeCount, 'node')}
          icon="hard-drive"
          featherIcon
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
    <EnvironmentStatsItem
      value={addPlural(containersCount, 'container')}
      icon="box"
      featherIcon
    >
      {containersCount > 0 && (
        <>
          <EnvironmentStatsItem
            value={running}
            icon="power"
            featherIcon
            iconClass="icon-success"
          />
          <EnvironmentStatsItem
            value={stopped}
            icon="power"
            featherIcon
            iconClass="icon-danger"
          />
          <EnvironmentStatsItem
            value={healthy}
            icon="heart"
            featherIcon
            iconClass="icon-success"
          />
          <EnvironmentStatsItem
            value={unhealthy}
            icon="heart"
            featherIcon
            iconClass="icon-warning"
          />
        </>
      )}
    </EnvironmentStatsItem>
  );
}
