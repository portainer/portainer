import {
  Environment,
  PlatformType,
} from '@/react/portainer/environments/types';
import { getPlatformType } from '@/react/portainer/environments/utils';

import { EnvironmentStatsDocker } from './EnvironmentStatsDocker';
import { EnvironmentStatsKubernetes } from './EnvironmentStatsKubernetes';

interface Props {
  environment: Environment;
}

export function EnvironmentStats({ environment }: Props) {
  const platform = getPlatformType(environment.Type);
  switch (platform) {
    case PlatformType.Kubernetes:
      return (
        <EnvironmentStatsKubernetes
          snapshots={environment.Kubernetes.Snapshots || []}
          type={environment.Type}
          agentVersion={environment.Agent.Version}
        />
      );
    case PlatformType.Docker:
      return (
        <EnvironmentStatsDocker
          snapshots={environment.Snapshots}
          type={environment.Type}
          agentVersion={environment.Agent.Version}
        />
      );
    default:
      return (
        <div className="blocklist-item-line endpoint-item">
          <span className="blocklist-item-desc">-</span>
        </div>
      );
  }
}
