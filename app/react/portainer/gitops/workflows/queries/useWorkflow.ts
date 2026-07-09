import { useQuery } from '@tanstack/react-query';

import {
  WorkflowsArtifactDetail,
  WorkflowsArtifactFileDetail,
  WorkflowsWorkflowDetail,
  WorkflowsWorkflowPhaseStatus,
  WorkflowsWorkflowStatusObject,
} from '@api/types.gen';
import { gitOpsWorkflowGet } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import {
  WorkflowArtifact,
  WorkflowArtifactFile,
  WorkflowDetail,
  WorkflowPhaseStatus,
  WorkflowStatusObject,
} from '../types';
import { workflowQueryKeys } from '../../queries/query-keys';

async function getWorkflow(id: number): Promise<WorkflowDetail> {
  const response = await gitOpsWorkflowGet({ path: { id } });

  return toWorkflowDetail(response.data);

  function toWorkflowDetail(wf: WorkflowsWorkflowDetail): WorkflowDetail {
    return {
      ...wf,
      artifacts: wf.artifacts?.map(toArtifact) || [],
    };
  }

  function toArtifact(artifact: WorkflowsArtifactDetail): WorkflowArtifact {
    return {
      ...artifact,
      status: toArtifactStatusObj(artifact.status),
      files: (artifact.files ?? []).filter(hasSourceId).map(toArtifactFile),
    };
  }

  function hasSourceId(
    file: WorkflowsArtifactFileDetail
  ): file is WorkflowsArtifactFileDetail & { sourceId: number } {
    return !!file.sourceId;
  }

  function toArtifactFile(
    file: WorkflowsArtifactFileDetail & { sourceId: number }
  ): WorkflowArtifactFile {
    return {
      ...file,
      sourceId: file.sourceId,
    };
  }

  function toArtifactStatusObj(
    statusObj: WorkflowsWorkflowStatusObject | undefined
  ): WorkflowStatusObject {
    return {
      artifact: toStatus(statusObj?.artifact),
      source: toStatus(statusObj?.source),
      target: toStatus(statusObj?.target),
    };
  }

  function toStatus(
    status: WorkflowsWorkflowPhaseStatus | undefined
  ): WorkflowPhaseStatus {
    return {
      status: status?.status || 'unknown',
      error: status?.error,
    };
  }
}

export function useWorkflow(id: number | undefined) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(id!),
    queryFn: () => getWorkflow(id!),
    enabled: !!id,
    ...withError('Failed loading workflow'),
  });
}
