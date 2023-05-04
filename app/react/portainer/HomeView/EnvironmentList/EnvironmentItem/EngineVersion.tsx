import { DockerSnapshot } from '@/react/docker/snapshots/types';
import {
  Environment,
  PlatformType,
  KubernetesSnapshot,
} from '@/react/portainer/environments/types';
import { getPlatformType } from '@/react/portainer/environments/utils';

export function EngineVersion({ environment }: { environment: Environment }) {
  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Docker:
      return <DockerEngineVersion snapshot={environment.Snapshots[0]} />;
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

function DockerEngineVersion({ snapshot }: { snapshot?: DockerSnapshot }) {
  if (!snapshot) {
    return null;
  }

  return (
    <span className="small text-muted vertical-center">
      {snapshot.Swarm ? 'Swarm' : 'Standalone'} {snapshot.DockerVersion}
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
