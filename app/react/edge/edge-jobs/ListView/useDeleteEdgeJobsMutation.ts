import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { EdgeJob } from '../types';
import { buildUrl } from '../queries/build-url';
import { queryKeys } from '../queries/query-keys';

export function useDeleteEdgeJobsMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (edgeJobIds: Array<EdgeJob['Id']>) =>
      promiseSequence(
        edgeJobIds.map((edgeJobId) => () => deleteEdgeJob(edgeJobId))
      ),
    mutationOptions(
      withError('Unable to delete Edge job(s)'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteEdgeJob(id: EdgeJob['Id']) {
  try {
    await axios.delete(buildUrl({ id }));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete edge job');
  }
}
