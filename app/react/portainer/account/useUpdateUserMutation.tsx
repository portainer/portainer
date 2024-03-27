import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { User } from '@/portainer/users/types';
import {
  mutationOptions,
  withInvalidate,
  queryClient,
} from '@/react-tools/react-query';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';
import { useCurrentUser } from '@/react/hooks/useUser';

export function useUpdateUserMutation() {
  const {
    user: { Id: userId },
  } = useCurrentUser();

  return useMutation(
    (user: Partial<User>) => updateUser(user, userId),
    mutationOptions(withInvalidate(queryClient, [userQueryKeys.base()]))
    // error notification should be handled by the caller
  );
}

async function updateUser(user: Partial<User>, userId: number) {
  try {
    const { data } = await axios.put(`/users/${userId}`, user);
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
