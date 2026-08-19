import {
  WorkflowsArtifactDetail,
  WorkflowsArtifactFileDetail,
  WorkflowsWorkflow,
  WorkflowsWorkflowPhaseStatus,
  WorkflowsWorkflowStatusObject,
} from '@api/types.gen';

import {
  Workflow,
  WorkflowArtifact,
  WorkflowPhaseStatus,
  WorkflowStatusObject,
} from '../types';

export function toWorkflow(workflow: WorkflowsWorkflow): Workflow {
  return {
    ...workflow,
    status: toStatusObject(workflow.status),
    artifacts: workflow.artifacts?.map(toArtifact) ?? [],
  };
}

function toArtifact(artifact: WorkflowsArtifactDetail): WorkflowArtifact {
  return {
    ...artifact,
    status: toStatusObject(artifact.status),
    files: artifact.files?.filter(hasSourceId) ?? [],
  };
}

export function toStatusObject(
  statusObj: WorkflowsWorkflowStatusObject | undefined
): WorkflowStatusObject {
  return {
    artifact: toPhaseStatus(statusObj?.artifact),
    source: toPhaseStatus(statusObj?.source),
    target: toPhaseStatus(statusObj?.target),
  };
}

function toPhaseStatus(
  status: WorkflowsWorkflowPhaseStatus | undefined
): WorkflowPhaseStatus {
  return {
    status: status?.status || 'unknown',
    error: status?.error,
  };
}

function hasSourceId(
  file: WorkflowsArtifactFileDetail
): file is WorkflowsArtifactFileDetail & { sourceId: number } {
  return !!file.sourceId;
}
