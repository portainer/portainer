import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate } from '@/react-tools/react-query';

import { EdgeJob } from '../../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useClearLogsMutation(id: EdgeJob['Id']) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: EnvironmentId) =>
      clearLogsMutation(id, environmentId),
    ...withInvalidate(queryClient, [queryKeys.base(id)]),
  });
}

async function clearLogsMutation(
  id: EdgeJob['Id'],
  environmentId: EnvironmentId
) {
  try {
    await axios.delete(buildUrl({ id, action: 'logs', taskId: environmentId }));
  } catch (err) {
    throw parseAxiosError(err, 'Failed clearing edge job result logs');
  }
}
