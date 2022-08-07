import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@@/datatables/types-old';

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

interface SettableQuickActionsTableSettings {
  hiddenQuickActions: QuickAction[];
}

export interface ContainersTableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    SettableQuickActionsTableSettings,
    RefreshableTableSettings {
  truncateContainerName: number;
}

export interface Port {
  host?: string;
  public: number;
  private: number;
}

export type ContainerId = string;

type DecoratedDockerContainer = {
  NodeName: string;
  ResourceControl?: ResourceControlViewModel;
  IP: string;
  StackName?: string;
  Status: ContainerStatus;
  Ports: Port[];
  StatusText: string;
  Image: string;
  Gpus: string;
};

export type DockerContainer = DecoratedDockerContainer &
  Omit<DockerContainerResponse, keyof DecoratedDockerContainer>;
