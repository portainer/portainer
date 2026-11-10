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
    <div className="flex w-full flex-1 items-center self-center md:ml-auto md:w-auto md:flex-none">
      {component}
    </div>
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
