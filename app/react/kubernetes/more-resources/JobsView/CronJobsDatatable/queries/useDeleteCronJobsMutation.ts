import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useDeleteCronJobsMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteCronJob, {
    ...withInvalidate(queryClient, [queryKeys.list(environmentId)]),
    ...withError('Unable to delete Cron Jobs'),
  });
}

type NamespaceCronJobsMap = Record<string, string[]>;

export async function deleteCronJob({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: NamespaceCronJobsMap;
}) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/cron_jobs/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e, `Unable to delete Cron Jobs`);
  }
}
