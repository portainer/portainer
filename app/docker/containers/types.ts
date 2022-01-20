import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

export type DockerContainerStatus =
  | 'paused'
  | 'stopped'
  | 'created'
  | 'healthy'
  | 'unhealthy'
  | 'starting'
  | 'running'
  | 'dead'
  | 'exited';

export type QuickAction = 'attach' | 'exec' | 'inspect' | 'logs' | 'stats';

export interface ContainersTableSettings {
  hiddenQuickActions: QuickAction[];
  hiddenColumns: string[];
  truncateContainerName: number;
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

export interface Port {
  host: string;
  public: string;
  private: string;
}

export type ContainerId = string;

export type DockerContainer = {
  IsPortainer: boolean;
  Status: DockerContainerStatus;
  NodeName: string;
  Id: ContainerId;
  IP: string;
  Names: string[];
  Created: string;
  ResourceControl: ResourceControlViewModel;
  Ports: Port[];
  StackName?: string;
  Image: string;
};
