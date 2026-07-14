import { useQuery } from '@tanstack/react-query';

import {
  type SourcesAutoUpdateInfo,
  type SourcesSourceDetail,
  WorkflowsSourceWorkflow,
  WorkflowsWorkflowStatusObject,
  WorkflowsStatus,
  WorkflowsWorkflowPhaseStatus,
  GittypesRepoConfig,
  GittypesGitAuthentication,
} from '@api/types.gen';
import { gitOpsSourceGet } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';
import {
  type RepoConfigResponse,
  type GitAuthenticationResponse,
} from '@/react/portainer/gitops/types';
import { AuthTypeOption } from '@/react/portainer/account/git-credentials/types';

import { Source } from '../types';
import {
  WorkflowPhaseStatus,
  WorkflowStatus,
  WorkflowStatusObject,
  WorkflowTarget,
} from '../../workflows/types';

import { sourceQueryKeys } from './query-keys';

export type AutoUpdateInfo = SourcesAutoUpdateInfo;

export type SourceWorkflow = WorkflowsSourceWorkflow & {
  status: WorkflowStatusObject;
  sourceId?: number;
  gitConfig?: RepoConfigResponse;
  target: WorkflowTarget;
  creationDate: number;
  lastSyncDate: number;
};

export type SourceDetail = Omit<SourcesSourceDetail, 'workflows' | 'usedBy'> & {
  workflows: Array<SourceWorkflow>;
  usedBy: number;
};

export function sourceOptions(id: Source['id']) {
  return {
    queryKey: sourceQueryKeys.detail(id!),
    queryFn: () => getSource(id!),
    ...withError('Failed loading source'),
  };
}

export function useSource(id: Source['id'] | undefined) {
  return useQuery({
    ...sourceOptions(id!),
    enabled: !!id,
  });
}

export async function getSource(id: Source['id']): Promise<SourceDetail> {
  const { data } = await gitOpsSourceGet({ path: { id } });

  return toSourceDetails(data);

  function toSourceDetails(source: SourcesSourceDetail): SourceDetail {
    return {
      ...source,
      workflows: source.workflows?.map(toWorkflow) ?? [],
      usedBy: source.usedBy ?? 0,
    };

    function toWorkflow(workflow: WorkflowsSourceWorkflow): SourceWorkflow {
      return {
        ...workflow,
        creationDate: workflow.creationDate ?? 0,
        lastSyncDate: workflow.lastSyncDate ?? 0,
        status: toWorkflowStatusObject(workflow.status),
        gitConfig: toWorkflowGitConfig(workflow.gitConfig),
      };
    }

    function toWorkflowStatusObject(
      statusObj: WorkflowsWorkflowStatusObject
    ): WorkflowStatusObject {
      return {
        ...statusObj,
        source: toPhaseStatus(statusObj.source),
        artifact: toPhaseStatus(statusObj.artifact),
        target: toPhaseStatus(statusObj.target),
      };
    }
  }

  function toPhaseStatus(
    phaseStatus: WorkflowsWorkflowPhaseStatus | undefined
  ): WorkflowPhaseStatus {
    return {
      ...phaseStatus,
      status: toWorkflowStatus(phaseStatus?.status),
    };
  }

  function toWorkflowStatus(
    status: WorkflowsStatus | undefined
  ): WorkflowStatus {
    if (!status) {
      return 'unknown';
    }

    return status;
  }

  function toWorkflowGitConfig(
    gitConfig: GittypesRepoConfig | undefined
  ): RepoConfigResponse | undefined {
    if (!gitConfig) {
      return undefined;
    }

    return {
      URL: gitConfig.URL ?? '',
      ReferenceName: gitConfig.ReferenceName ?? '',
      ConfigFilePath: gitConfig.ConfigFilePath ?? '',
      ConfigHash: gitConfig.ConfigHash ?? '',
      TLSSkipVerify: gitConfig.TLSSkipVerify ?? false,
      Authentication: toGitAuthentication(gitConfig.Authentication),
    };
  }

  function toGitAuthentication(
    auth: GittypesGitAuthentication | undefined
  ): GitAuthenticationResponse | undefined {
    if (!auth) {
      return undefined;
    }

    return {
      Username: auth.Username,
      Password: auth.Password,
      AuthorizationType: auth.AuthorizationType as AuthTypeOption | undefined,
    };
  }
}
