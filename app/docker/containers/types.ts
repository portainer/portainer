import { ResourceControlViewModel } from '@/portainer/models/resourceControl/resourceControl';

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

export interface HttpRequestHelper {
  setPortainerAgentTargetHeader: (header: string) => void;
}

export interface NotificationsService {
  success: (title: string, text: string) => void;
  error: (title: string, error: Error, fallbackText: string) => void;
}

export interface ModalService {
  confirmContainerDeletion: (
    title: string,
    callback: (result: [boolean]) => void
  ) => void;
}
