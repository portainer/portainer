import { useQuery } from '@tanstack/react-query';

import {
  type SourcesWorkflow,
  GittypesRepoConfig,
  GittypesGitAuthentication,
} from '@api/types.gen';
import { gitOpsSourceWorkflowsList } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';
import {
  type RepoConfigResponse,
  type GitAuthenticationResponse,
} from '@/react/portainer/gitops/types';
import { AuthTypeOption } from '@/react/portainer/account/git-credentials/types';

import { Source } from '../types';
import { WorkflowStatusObject, WorkflowTarget } from '../../workflows/types';
import { toStatusObject } from '../../workflows/queries/mappers';

import { sourceQueryKeys } from './query-keys';

export type SourceWorkflow = SourcesWorkflow & {
  status: WorkflowStatusObject;
  sourceId?: number;
  gitConfig?: RepoConfigResponse;
  target: WorkflowTarget;
  creationDate: number;
  lastSyncDate: number;
};

export function sourceWorkflowsOptions(id: Source['id']) {
  return {
    queryKey: sourceQueryKeys.workflows(id!),
    queryFn: () => getSourceWorkflows(id!),
    ...withError('Failed loading source workflows'),
  };
}

export function useSourceWorkflows(id: Source['id'] | undefined) {
  return useQuery({
    ...sourceWorkflowsOptions(id!),
    enabled: !!id,
  });
}

export async function getSourceWorkflows(
  id: Source['id']
): Promise<Array<SourceWorkflow>> {
  const { data } = await gitOpsSourceWorkflowsList({ path: { id } });

  return data.map(toWorkflow);

  function toWorkflow(workflow: SourcesWorkflow): SourceWorkflow {
    return {
      ...workflow,
      creationDate: workflow.creationDate ?? 0,
      lastSyncDate: workflow.lastSyncDate ?? 0,
      status: toStatusObject(workflow.status),
      gitConfig: toWorkflowGitConfig(workflow.gitConfig),
    };
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
