import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';
import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SettableQuickActionsTableSettings,
  SortableTableSettings,
} from '@/portainer/components/datatables/types';

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

export interface ContainersTableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    SettableQuickActionsTableSettings<QuickAction>,
    RefreshableTableSettings {
  truncateContainerName: number;
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
