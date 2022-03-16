import {
  DockerSnapshot,
  EnvironmentType,
} from '@/portainer/environments/types';
import { addPlural } from '@/portainer/helpers/strings';

import { Stat } from './EnvironmentStatsItem';

interface Props {
  snapshots: DockerSnapshot[];
  type: EnvironmentType;
}

export function EnvironmentStatsDocker({ snapshots = [], type }: Props) {
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
        <Stat
          value={addPlural(snapshot.StackCount, 'stack')}
          icon="fa-th-list"
        />

        {!!snapshot.Swarm && (
          <Stat
            value={addPlural(snapshot.ServiceCount, 'service')}
            icon="fa-list-alt"
          />
        )}

        <ContainerStats
          running={snapshot.RunningContainerCount}
          stopped={snapshot.StoppedContainerCount}
          healthy={snapshot.HealthyContainerCount}
          unhealthy={snapshot.UnhealthyContainerCount}
        />

        <Stat value={addPlural(snapshot.VolumeCount, 'volume')} icon="fa-hdd" />
        <Stat value={addPlural(snapshot.ImageCount, 'image')} icon="fa-clone" />
      </span>

      <span className="small text-muted space-x-3">
        <span>{snapshot.Swarm ? 'Swarm' : 'Standalone'}</span>
        <span>{snapshot.DockerVersion}</span>
        {type === EnvironmentType.AgentOnDocker && (
          <span>
            + <i className="fa fa-bolt" aria-hidden="true" /> Agent
          </span>
        )}
        {snapshot.Swarm && (
          <Stat value={addPlural(snapshot.NodeCount, 'node')} icon="fa-hdd" />
        )}
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
    <Stat value={addPlural(containersCount, 'container')} icon="fa-cubes">
      {containersCount > 0 && (
        <span className="space-x-2">
          <span>-</span>
          <Stat value={running} icon="fa-power-off green-icon" />
          <Stat value={stopped} icon="fa-power-off red-icon" />
          <span>/</span>
          <Stat value={healthy} icon="fa-heartbeat green-icon" />
          <Stat value={unhealthy} icon="fa-heartbeat orange-icon" />
        </span>
      )}
    </Stat>
  );
}
