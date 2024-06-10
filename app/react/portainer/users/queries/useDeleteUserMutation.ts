import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { UserId } from '@/portainer/users/types';
import { buildUrl } from '@/portainer/users/user.service';

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (id: UserId) => deleteUser(id),

    mutationOptions(
      withError('Unable to delete user'),
      withInvalidate(queryClient, [['users']])
    )
  );
}

export async function deleteUser(id: UserId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (error) {
    throw parseAxiosError(error);
  }
}
