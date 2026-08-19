import { DockerSnapshot } from '@/react/docker/snapshots/types';
import {
  Environment,
  PlatformType,
  KubernetesSnapshot,
  ContainerEngine,
} from '@/react/portainer/environments/types';
import { getPlatformType } from '@/react/portainer/environments/utils';
import { getDockerEnvironmentType } from '@/react/portainer/environments/utils/getDockerEnvironmentType';

export function EngineVersion({ environment }: { environment: Environment }) {
  const platform = getPlatformType(environment.Type);
  const isPodman = environment.ContainerEngine === ContainerEngine.Podman;

  switch (platform) {
    case PlatformType.Docker:
      return (
        <DockerEngineVersion
          snapshot={environment.Snapshots[0]}
          isPodman={isPodman}
        />
      );
    case PlatformType.Kubernetes:
      return (
        <KubernetesEngineVersion
          snapshot={environment.Kubernetes.Snapshots?.[0]}
        />
      );
    default:
      return null;
  }
}

function DockerEngineVersion({
  snapshot,
  isPodman,
}: {
  snapshot?: DockerSnapshot;
  isPodman?: boolean;
}) {
  if (!snapshot) {
    return null;
  }
  const type = getDockerEnvironmentType(snapshot.Swarm, isPodman);

  return (
    <span className="small text-muted vertical-center">
      {type} {snapshot.DockerVersion}
    </span>
  );
}

function KubernetesEngineVersion({
  snapshot,
}: {
  snapshot?: KubernetesSnapshot;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <span className="small text-muted vertical-center">
      Kubernetes {snapshot.KubernetesVersion}
    </span>
  );
}
