import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EnvironmentGroup } from '../../types';
import { buildUrl } from '../../queries/build-url';
import { queryKeys } from '../../queries/query-keys';

export function useDeleteEnvironmentGroupsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEnvironmentGroups,
    ...withError('Failed to delete environment groups'),
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

async function deleteEnvironmentGroups(
  environmentGroupIds: Array<EnvironmentGroup['Id']>
) {
  return promiseSequence(
    environmentGroupIds.map(
      (environmentGroupId) => () => deleteEnvironmentGroup(environmentGroupId)
    )
  );
}

async function deleteEnvironmentGroup(id: EnvironmentGroup['Id']) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete environment group');
  }
}
