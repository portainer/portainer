import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useDeleteJobsMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteJob, {
    ...withInvalidate(queryClient, [queryKeys.list(environmentId)]),
    ...withError('Unable to delete Jobs'),
  });
}

type NamespaceJobsMap = Record<string, string[]>;

export async function deleteJob({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: NamespaceJobsMap;
}) {
  try {
    return await axios.post(`kubernetes/${environmentId}/jobs/delete`, data);
  } catch (e) {
    throw parseAxiosError(e, `Unable to delete Jobs`);
  }
}
