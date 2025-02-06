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
      const resp = await deleteEnvironments(environments);

      if (resp === null) {
        return { deleted: environments, errors: [] };
      }

      return {
        deleted: environments.filter((e) =>
          (resp.deleted || []).includes(e.id)
        ),
        errors: environments.filter((e) => (resp.errors || []).includes(e.id)),
      };
    },
    {
      ...withError('Unable to delete environment(s)'),
      onSuccess: ({ deleted, errors }) => {
        queryClient.invalidateQueries(['environments']);
        // show an error message for each env that failed to delete
        errors.forEach((e) => {
          notifyError(`Failed to remove environment ${e.name}`, undefined);
        });
        // show one summary message for all successful deletes
        if (deleted.length) {
          notifySuccess(
            `${pluralize(deleted.length, 'Environment')} successfully removed`,
            deleted.map((d) => d.name).join(', ')
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
    const { data } = await axios.post<{
      deleted: EnvironmentId[];
      errors: EnvironmentId[];
    } | null>(buildUrl(undefined, 'delete'), {
      endpoints: environments,
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete environment');
  }
}
