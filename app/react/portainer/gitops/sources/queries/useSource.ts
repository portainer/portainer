import { useQuery } from '@tanstack/react-query';

import {
  type SourcesGitAuthInfo,
  type SourcesConnectionInfo,
  type SourcesAutoUpdateInfo,
  type SourcesSourceDetail,
  WorkflowsWorkflow,
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
  Workflow,
  WorkflowPhaseStatus,
  WorkflowStatus,
  WorkflowStatusObject,
} from '../../WorkflowsView/types';

import { sourceQueryKeys } from './query-keys';

export type GitAuthInfo = SourcesGitAuthInfo;
export type ConnectionInfo = SourcesConnectionInfo;
export type AutoUpdateInfo = SourcesAutoUpdateInfo;

export type SourceDetail = Omit<SourcesSourceDetail, 'workflows' | 'usedBy'> & {
  workflows: Array<Workflow>;
  usedBy: number;
};

async function getSource(id: Source['id']): Promise<SourceDetail> {
  const { data } = await gitOpsSourceGet({ path: { id } });

  return toSourceDetails(data);

  function toSourceDetails(source: SourcesSourceDetail): SourceDetail {
    return {
      ...source,
      workflows: source.workflows?.map(toWorkflow) ?? [],
      usedBy: source.usedBy ?? 0,
    };

    function toWorkflow(workflow: WorkflowsWorkflow): Workflow {
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

export function useSource(id: Source['id'] | undefined) {
  return useQuery({
    queryKey: sourceQueryKeys.detail(id!),
    queryFn: () => getSource(id!),
    enabled: !!id,
    ...withError('Failed loading source'),
  });
}
