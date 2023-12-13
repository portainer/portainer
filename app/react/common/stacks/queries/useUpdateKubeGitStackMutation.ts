import { useMutation } from 'react-query';

import axios from '@/portainer/services/axios';
import {
  withError,
  withInvalidate,
  queryClient,
} from '@/react-tools/react-query';
import { StackId } from '@/react/common/stacks/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutoUpdateModel } from '@/react/portainer/gitops/types';

import { stacksQueryKeys } from './query-keys';
import { buildStackUrl } from './buildUrl';

type UpdateKubeGitStackPayload = {
  AutoUpdate: AutoUpdateModel;
  RepositoryAuthentication: boolean;
  RepositoryGitCredentialID: number;
  RepositoryPassword: string;
  RepositoryReferenceName: string;
  RepositoryUsername: string;
  TLSSkipVerify: boolean;
};

// update a stack from a git repository
export function useUpdateKubeGitStackMutation(
  stackId: StackId,
  environmentId: EnvironmentId
) {
  return useMutation(
    (stack: UpdateKubeGitStackPayload) =>
      updateGitStack({ stack, stackId, environmentId }),
    {
      ...withError('Unable to update stack'),
      ...withInvalidate(queryClient, [stacksQueryKeys.stackFile(stackId)]),
    }
  );
}

function updateGitStack({
  stackId,
  stack,
  environmentId,
}: {
  stackId: StackId;
  stack: UpdateKubeGitStackPayload;
  environmentId: EnvironmentId;
}) {
  return axios.put(buildStackUrl(stackId), stack, {
    params: { endpointId: environmentId },
  });
}
