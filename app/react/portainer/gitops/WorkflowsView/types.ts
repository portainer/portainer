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

export interface WorkflowPhaseStatus {
  status: WorkflowStatus;
  error?: string;
}

export interface WorkflowStatusObject {
  source: WorkflowPhaseStatus;
  artifact: WorkflowPhaseStatus;
  target: WorkflowPhaseStatus;
}

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
  status: WorkflowStatusObject;
  gitConfig?: RepoConfigResponse;
  target: WorkflowTarget;
  creationDate: number;
  lastSyncDate: number;
}

const STATUS_PRIORITY: Record<WorkflowStatus, number> = {
  error: 4,
  syncing: 3,
  paused: 2,
  healthy: 1,
  unknown: 0,
};

export function effectiveWorkflowStatus(item: Workflow): {
  status: WorkflowStatus;
  error?: string;
} {
  const phases = [item.status.source, item.status.artifact, item.status.target];
  const winning = phases.reduce((best, phase) =>
    STATUS_PRIORITY[phase.status] > STATUS_PRIORITY[best.status] ? phase : best
  );
  return { status: winning.status, error: winning.error };
}
