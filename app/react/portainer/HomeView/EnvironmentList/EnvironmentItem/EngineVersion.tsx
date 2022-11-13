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
        <KubernetesEngineVersion snapshots={environment.Kubernetes.Snapshots} />
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
  snapshots,
}: {
  snapshots?: Array<KubernetesSnapshot> | null;
}) {
  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  const snapshot = snapshots[0];

  return (
    <span className="small text-muted vertical-center">
      Kubernetes {snapshot.KubernetesVersion}
    </span>
  );
}
