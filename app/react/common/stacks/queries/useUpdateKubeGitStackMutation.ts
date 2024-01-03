import { useMutation } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  withError,
  withInvalidate,
  queryClient,
} from '@/react-tools/react-query';
import { Stack, StackId } from '@/react/common/stacks/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { stacksQueryKeys } from '@/react/common/stacks/queries/query-keys';
import { buildStackUrl } from '@/react/common/stacks/queries/buildUrl';
import {
  AutoUpdateResponse,
  GitAuthModel,
  GitCredentialsModel,
} from '@/react/portainer/gitops/types';
import { saveGitCredentialsIfNeeded } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';

export interface UpdateKubeGitStackPayload extends GitCredentialsModel {
  AutoUpdate: AutoUpdateResponse | null;
  RepositoryReferenceName: string;
  TLSSkipVerify: boolean;
}

// update a stack from a git repository
export function useUpdateKubeGitStackMutation(
  stackId: StackId,
  environmentId: EnvironmentId,
  userId: number
) {
  return useMutation(
    async ({
      stack,
      authentication,
    }: {
      stack: UpdateKubeGitStackPayload;
      authentication: GitAuthModel;
    }) => {
      // save the new git credentials if the user has selected to save them
      const newGitAuth = await saveGitCredentialsIfNeeded(
        userId,
        authentication
      );
      const stackWithUpdatedAuth: UpdateKubeGitStackPayload = {
        ...stack,
        ...newGitAuth,
      };
      return updateGitStack({
        stack: stackWithUpdatedAuth,
        stackId,
        environmentId,
      });
    },
    {
      ...withError('Unable to update application'),
      ...withInvalidate(queryClient, [stacksQueryKeys.stackFile(stackId)]),
    }
  );
}

async function updateGitStack({
  stackId,
  stack,
  environmentId,
}: {
  stackId: StackId;
  stack: UpdateKubeGitStackPayload;
  environmentId: EnvironmentId;
}) {
  try {
    return await axios.post<Stack>(buildStackUrl(stackId, 'git'), stack, {
      params: { endpointId: environmentId },
    });
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update stack');
  }
}
