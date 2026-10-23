import {
  WorkflowsArtifactDetail,
  WorkflowsArtifactFileDetail,
  WorkflowsWorkflow,
} from '@api/types.gen';

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
  resolvedEndpointIds?: number[];
}

export interface WorkflowFileRef {
  sourceId: number;
  path: string;
  ref: string;
}

export type WorkflowArtifact = Omit<WorkflowsArtifactDetail, 'status'> & {
  status: WorkflowStatusObject;
  files: Array<WorkflowArtifactFile>;
};

export type WorkflowArtifactFile = WorkflowsArtifactFileDetail & {
  sourceId: number;
};

export type Workflow = Omit<WorkflowsWorkflow, 'artifacts' | 'status'> & {
  status: WorkflowStatusObject;
  artifacts: WorkflowArtifact[];
};
