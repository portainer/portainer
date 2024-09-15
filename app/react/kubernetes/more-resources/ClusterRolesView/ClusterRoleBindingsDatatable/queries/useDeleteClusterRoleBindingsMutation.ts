import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useDeleteClusterRoleBindingsMutation(
  environmentId: EnvironmentId
) {
  const queryClient = useQueryClient();
  return useMutation(deleteClusterRoleBindings, {
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.list(environmentId)),
    ...withError('Unable to delete cluster role bindings'),
  });
}

export async function deleteClusterRoleBindings({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: string[];
}) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/cluster_role_bindings/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e, `Unable to delete cluster role bindings`);
  }
}
