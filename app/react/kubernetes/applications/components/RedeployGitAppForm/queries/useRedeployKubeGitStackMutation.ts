import { useMutation } from 'react-query';

import { buildStackUrl } from '@/react/common/stacks/queries/buildUrl';
import { stacksQueryKeys } from '@/react/common/stacks/queries/query-keys';
import { StackId } from '@/react/common/stacks/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  withError,
  withInvalidate,
  queryClient,
} from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { RedeployGitStackPayload } from '../types';

export function useRedeployKubeGitStackMutation(
  stackId: StackId,
  environmentId: EnvironmentId
) {
  return useMutation(
    (payload: RedeployGitStackPayload) =>
      redeployKubeGitStack({
        stackId,
        redeployPayload: payload,
        environmentId,
      }),
    {
      ...withError('Unable to redeploy application.'),
      ...withInvalidate(queryClient, [stacksQueryKeys.stackFile(stackId)]),
    }
  );
}

async function redeployKubeGitStack({
  stackId,
  redeployPayload,
  environmentId,
}: {
  stackId: StackId;
  environmentId: EnvironmentId;
  redeployPayload: RedeployGitStackPayload;
}) {
  try {
    return await axios.put(
      buildStackUrl(stackId, 'git/redeploy'),
      redeployPayload,
      {
        params: { endpointId: environmentId },
      }
    );
  } catch (e) {
    throw parseAxiosError(e);
  }
}
