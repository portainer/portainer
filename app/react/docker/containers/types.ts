import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { DockerContainerResponse } from './types/response';

export enum ContainerStatus {
  Paused = 'paused',
  Stopped = 'stopped',
  Created = 'created',
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
  Starting = 'starting',
  Running = 'running',
  Dead = 'dead',
  Exited = 'exited',
}

export type QuickAction = 'attach' | 'exec' | 'inspect' | 'logs' | 'stats';

export interface Port {
  host?: string;
  public: number;
  private: number;
}

export type ContainerId = string;

/**
 * Computed fields from Container List Raw data
 */
type DecoratedDockerContainer = {
  NodeName: string;
  ResourceControl?: ResourceControlViewModel;
  IP: string;
  StackName?: string;
  Status: ContainerStatus;
  Ports: Port[];
  StatusText: string;
  Gpus: string;
};

/**
 * Docker Container list ViewModel
 *
 * Alias AngularJS ContainerViewModel
 *
 * Raw details is ContainerDetailsJSON
 */
export type ContainerListViewModel = DecoratedDockerContainer &
  Omit<DockerContainerResponse, keyof DecoratedDockerContainer>;

export type ContainerLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
