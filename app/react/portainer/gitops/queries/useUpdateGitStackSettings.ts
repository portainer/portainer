import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { GitStackPayload } from '@/react/common/stacks/types';
import { buildStackUrl } from '@/react/common/stacks/queries/buildUrl';
import { queryKeys } from '@/react/common/stacks/queries/query-keys';
import { withGlobalError } from '@/react-tools/react-query';

async function updateGitStackSettings(
  stackId: number,
  endpointId: number,
  payload: GitStackPayload
) {
  try {
    const { data } = await axios.post(buildStackUrl(stackId, 'git'), payload, {
      params: { endpointId },
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export function useUpdateGitStackSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stackId,
      endpointId,
      payload,
    }: {
      stackId: number;
      endpointId: number;
      payload: GitStackPayload;
    }) => updateGitStackSettings(stackId, endpointId, payload),
    onSuccess: (_, { stackId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stack(stackId),
        exact: true,
      });
    },
    ...withGlobalError('Unable to save stack settings'),
  });
}
