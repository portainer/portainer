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

  const component = getComponent(platform, environment);

  return (
    <span className="blocklist-item-desc flex flex-wrap items-center gap-x-10 gap-y-2">
      {component}
    </span>
  );
}

function getComponent(platform: PlatformType, environment: Environment) {
  switch (platform) {
    case PlatformType.Kubernetes:
      return (
        <EnvironmentStatsKubernetes
          snapshot={environment.Kubernetes.Snapshots?.[0]}
        />
      );
    case PlatformType.Docker:
      return <EnvironmentStatsDocker snapshot={environment.Snapshots?.[0]} />;
    default:
      return null;
  }
}
