import clsx from 'clsx';

import KubernetesLogo from '@/assets/ico/vendor/kubernetes.svg';
import DockerLogo from '@/assets/ico/vendor/docker.svg';
import PodmanLogo from '@/assets/ico/vendor/podman.svg';

import { EnvironmentGroup } from '../types';

interface Props {
  group: EnvironmentGroup;
  className?: string;
}

export function EnvironmentTypeBreakdown({ group, className }: Props) {
  if (!group.Total || group.Total === 0) {
    return null;
  }

  if (!group.TypeInfo) {
    return (
      <span
        className={className}
        data-cy={`environment-group-size_${group.Name}`}
      >
        {group.Total} {group.Total === 1 ? 'Environment' : 'Environments'}
      </span>
    );
  }

  return (
    <div
      className={clsx('flex items-center gap-3', className)}
      data-cy={`environment-group-size_${group.Name}`}
    >
      {group.TypeInfo.Kubernetes > 0 && (
        <div className="flex items-center gap-1">
          <img src={KubernetesLogo} alt="Kubernetes" className="h-4 w-4" />
          <span>
            <b>{group.TypeInfo.Kubernetes}</b> Kubernetes
          </span>
        </div>
      )}
      {group.TypeInfo.Docker > 0 && (
        <div className="flex items-center gap-1">
          <img src={DockerLogo} alt="Docker" className="h-4 w-4" />
          <span>
            <b>{group.TypeInfo.Docker}</b> Docker
          </span>
        </div>
      )}
      {group.TypeInfo.Podman > 0 && (
        <div className="flex items-center gap-1">
          <img src={PodmanLogo} alt="Podman" className="h-4 w-4" />
          <span>
            <b>{group.TypeInfo.Podman}</b> Podman
          </span>
        </div>
      )}
    </div>
  );
}
