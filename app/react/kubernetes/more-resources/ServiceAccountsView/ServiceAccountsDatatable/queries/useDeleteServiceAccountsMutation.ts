import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useDeleteServiceAccountsMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteServiceAccounts, {
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.list(environmentId)),
    ...withGlobalError('Unable to delete service accounts'),
  });
}

export async function deleteServiceAccounts({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: Record<string, string[]>;
}) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/service_accounts/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e, `Unable to delete service accounts`);
  }
}
