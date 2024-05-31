import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { StackType } from '@/react/common/stacks/types';
import { useIsSwarm } from '@/react/docker/proxy/queries/useInfo';

export function useIsDeployable(type: StackType | undefined) {
  const environmentId = useEnvironmentId();

  const isSwarm = useIsSwarm(environmentId);

  switch (type) {
    case StackType.DockerCompose:
      return !isSwarm;
    case StackType.DockerSwarm:
      return isSwarm;
    case StackType.Kubernetes:
    default:
      return false;
  }
}
