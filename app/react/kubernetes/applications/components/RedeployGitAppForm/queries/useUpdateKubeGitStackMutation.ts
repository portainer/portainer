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

import { UpdateKubeGitStackPayload } from '../types';

// update a stack from a git repository
export function useUpdateKubeGitStackMutation(
  stackId: StackId,
  environmentId: EnvironmentId
) {
  return useMutation(
    (stack: UpdateKubeGitStackPayload) =>
      updateGitStack({ stack, stackId, environmentId }),
    {
      ...withError('Unable to update application.'),
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
    throw parseAxiosError(e);
  }
}
