import {
  WorkflowsArtifactDetail,
  WorkflowsArtifactFileDetail,
  WorkflowsWorkflowDetail,
} from '@api/types.gen';

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
  resolvedEndpointIds?: number[];
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

export type WorkflowDetail = Omit<WorkflowsWorkflowDetail, 'artifacts'> & {
  artifacts: WorkflowArtifact[];
};
