import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';
import { UserId } from '@/portainer/users/types';
import { buildUrl } from '@/portainer/users/user.service';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UserId) => deleteUser(id),
    ...withGlobalError('Unable to delete user'),
    ...withInvalidate(queryClient, [userQueryKeys.base()]),
  });
}

export async function deleteUser(id: UserId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (error) {
    throw parseAxiosError(error);
  }
}
