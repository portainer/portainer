import {
  WorkflowStatus,
  WorkflowPhaseStatus,
  WorkflowStatusObject,
  WorkflowArtifact,
  Workflow,
} from './types';

const STATUS_PRIORITY: Record<WorkflowStatus, number> = {
  error: 4,
  syncing: 3,
  paused: 2,
  healthy: 1,
  unknown: 0,
};

export function worstPhaseStatus(
  phases: WorkflowPhaseStatus[]
): WorkflowPhaseStatus {
  return phases.reduce((worst, phase) =>
    STATUS_PRIORITY[phase.status || 'unknown'] >
    STATUS_PRIORITY[worst.status || 'unknown']
      ? phase
      : worst
  );
}

export function effectiveWorkflowStatus(item: {
  status: WorkflowStatusObject;
}): WorkflowPhaseStatus {
  return worstPhaseStatus([
    item.status.source,
    item.status.artifact,
    item.status.target,
  ]);
}

export type TargetRollupTone = 'success' | 'danger' | 'warning' | 'muted';

export interface TargetRollup {
  synced: number;
  total: number;
  tone: TargetRollupTone;
}

/** One entry per target counted for an artifact: one edge group, or one stack endpoint. */
function artifactTargetStatuses(artifact: WorkflowArtifact): WorkflowStatus[] {
  if (artifact.type === 'edgeStack') {
    return (
      artifact.target?.edgeGroupIds?.map(
        (groupId) => artifact.target?.groupStatus?.[groupId] ?? 'unknown'
      ) ?? []
    );
  }

  return artifact.status?.target?.status ? [artifact.status.target.status] : [];
}

export function computeArtifactTargetCount(artifact: WorkflowArtifact): number {
  return artifactTargetStatuses(artifact).length;
}

export function computeTargetRollup(workflow: Workflow): TargetRollup {
  if (workflow.artifacts.length === 0) {
    return { synced: 0, total: 0, tone: 'muted' };
  }

  const statuses = workflow.artifacts.flatMap(artifactTargetStatuses);
  const synced = statuses.filter((status) => status === 'healthy').length;
  const hasError = statuses.some((status) => status === 'error');
  const hasNonHealthy = statuses.some((status) => status !== 'healthy');

  const tone: TargetRollupTone = hasError
    ? 'danger'
    : hasNonHealthy
      ? 'warning'
      : 'success';

  return { synced, total: statuses.length, tone };
}
