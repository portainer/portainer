import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { StackId } from '../types';

import { queryKeys } from './query-keys';

interface DeleteStackParams {
  id?: StackId;
  name?: string;
  external: boolean;
  environmentId: EnvironmentId;
}

export function useDeleteStackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStack,
    onSuccess: (_, variables) => {
      // Remove the deleted stack's query data to prevent refetch attempts
      if (variables.id) {
        queryClient.removeQueries(queryKeys.stack(variables.id));
        queryClient.removeQueries(queryKeys.stackFile(variables.id));
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
        // exact: true,
      });
    },
    ...withError('Unable to delete stack'),
  });
}

async function deleteStack({
  id,
  name,
  external,
  environmentId,
}: DeleteStackParams) {
  try {
    await axios.delete(`/stacks/${id || name}`, {
      params: {
        external,
        endpointId: environmentId,
      },
    });
  } catch (error) {
    throw parseAxiosError(error, 'Unable to delete stack');
  }
}
