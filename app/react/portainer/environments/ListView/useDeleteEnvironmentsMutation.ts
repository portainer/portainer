import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';

import { buildUrl } from '../environment.service/utils';
import { EnvironmentId } from '../types';

export function useDeleteEnvironmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    async (
      environments: {
        id: EnvironmentId;
        name: string;
        deleteCluster?: boolean;
      }[]
    ) => {
      const resps = await deleteEnvironments(environments);
      const successfulDeletions = resps.filter((r) => r.err === null);
      const failedDeletions = resps.filter((r) => r.err !== null);
      return { successfulDeletions, failedDeletions };
    },
    {
      ...withError('Unable to delete environment(s)'),
      onSuccess: ({ successfulDeletions, failedDeletions }) => {
        queryClient.invalidateQueries(['environments']);
        // show an error message for each env that failed to delete
        failedDeletions.forEach((deletion) => {
          notifyError(
            `Failed to remove environment`,
            new Error(deletion.err ? deletion.err.Message : '') as Error
          );
        });
        // show one summary message for all successful deletes
        if (successfulDeletions.length) {
          notifySuccess(
            `${pluralize(
              successfulDeletions.length,
              'Environment'
            )} successfully removed`,
            successfulDeletions.map((deletion) => deletion.name).join(', ')
          );
        }
      },
    }
  );
}

async function deleteEnvironments(
  environments: { id: EnvironmentId; deleteCluster?: boolean }[]
) {
  try {
    const { data } = await axios.post<
      { name: string; err: { Message: string } | null }[]
    >(buildUrl(undefined, 'remove'), {
      environments,
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete environment');
  }
}
