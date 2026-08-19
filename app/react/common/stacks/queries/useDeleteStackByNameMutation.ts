import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { StackId } from '../types';

import { queryKeys } from './query-keys';

interface DeleteStackParams {
  stackId: StackId;
  stackName: string;
  environmentId: EnvironmentId;
  namespace: string;
}

export function useDeleteStackByNameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStackByName,
    onSuccess: (_, variables) => {
      // Invalidate the specific stack query
      queryClient.invalidateQueries(queryKeys.stack(variables.stackId));
      // Invalidate all stacks queries
      queryClient.invalidateQueries(queryKeys.base());
    },
    ...withError('Unable to delete stack'),
  });
}

async function deleteStackByName({
  environmentId,
  namespace,
  stackName,
}: DeleteStackParams) {
  try {
    await axios.delete(`/stacks/name/${stackName}`, {
      params: {
        external: false,
        name: stackName,
        endpointId: environmentId,
        namespace,
      },
    });
  } catch (error) {
    throw parseAxiosError(error, 'Unable to delete stack');
  }
}
