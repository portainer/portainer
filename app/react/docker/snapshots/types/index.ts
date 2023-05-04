import { DockerContainer } from '@/react/docker/containers/types';

export type DockerContainerSnapshot = DockerContainer & {
  Env?: string[];
};

export type DockerSnapshotRaw = {
  Containers: DockerContainerSnapshot[];
  SnapshotTime: string;
};

export interface DockerSnapshot {
  TotalCPU: number;
  TotalMemory: number;
  NodeCount: number;
  ImageCount: number;
  VolumeCount: number;
  RunningContainerCount: number;
  StoppedContainerCount: number;
  HealthyContainerCount: number;
  UnhealthyContainerCount: number;
  Time: number;
  StackCount: number;
  ServiceCount: number;
  Swarm: boolean;
  DockerVersion: string;
  GpuUseAll: boolean;
  GpuUseList: string[];
  SnapshotRaw: DockerSnapshotRaw;
}
