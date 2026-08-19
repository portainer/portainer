import { PortainerDockerSnapshot } from '@api/types.gen';

import { ContainerListViewModel } from '@/react/docker/containers/types';

export type DockerContainerSnapshot = ContainerListViewModel & {
  Env: string[];
};

export type DockerSnapshotRaw = {
  Containers: DockerContainerSnapshot[];
  SnapshotTime: string;
};

export interface DockerSnapshot extends PortainerDockerSnapshot {
  GpuUseList: string[];
}
