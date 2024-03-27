import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { EdgeGroup } from '../types';
import { buildUrl } from '../queries/build-url';
import { queryKeys } from '../queries/query-keys';

export function useDeleteEdgeGroupsMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (edgeGroupIds: Array<EdgeGroup['Id']>) =>
      promiseSequence(
        edgeGroupIds.map((edgeGroupId) => () => deleteEdgeGroup(edgeGroupId))
      ),
    mutationOptions(
      withError('Unable to delete Edge Group(s)'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteEdgeGroup(id: EdgeGroup['Id']) {
  try {
    await axios.delete(buildUrl({ id }));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete edge Group');
  }
}
