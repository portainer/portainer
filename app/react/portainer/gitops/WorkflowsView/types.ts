import { RepoConfigResponse } from '@/react/portainer/gitops/types';

export type WorkflowStatus =
  | 'healthy'
  | 'error'
  | 'syncing'
  | 'paused'
  | 'unknown';
export type WorkflowType = 'stack' | 'edgeStack';
export type DeploymentPlatform =
  | 'dockerStandalone'
  | 'dockerSwarm'
  | 'kubernetes';

export interface WorkflowTarget {
  endpointId?: number;
  namespace?: string;
  edgeGroupIds?: number[];
  groupStatus?: Record<number, WorkflowStatus>;
}

export interface Workflow {
  id: number;
  name: string;
  type: WorkflowType;
  platform: DeploymentPlatform;
  status: WorkflowStatus;
  statusMessage?: string;
  gitConfig?: RepoConfigResponse;
  target: WorkflowTarget;
  creationDate: number;
  lastSyncDate: number;
}
