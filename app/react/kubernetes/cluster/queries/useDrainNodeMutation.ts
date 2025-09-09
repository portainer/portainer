import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate, withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { queryKeys as applicationQueryKeys } from '../../applications/queries/query-keys';

import { queryKeys } from './query-keys';

export function useDrainNodeMutation(
  environmentId: EnvironmentId,
  nodeName: string
) {
  const queryClient = useQueryClient();

  return useMutation(() => drainNode(environmentId, nodeName), {
    ...withInvalidate(queryClient, [
      queryKeys.nodes(environmentId),
      queryKeys.node(environmentId, nodeName),
      // invalidate apps, since drain can evict pods
      applicationQueryKeys.applications(environmentId),
    ]),
    ...withGlobalError('Unable to drain node'),
  });
}

async function drainNode(environmentId: EnvironmentId, nodeName: string) {
  try {
    await axios.post(`/kubernetes/${environmentId}/nodes/${nodeName}/drain`);
  } catch (error) {
    throw parseAxiosError(error);
  }
}
