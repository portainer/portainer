import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from '../user.service';
import { User } from '../types';

import { userQueryKeys } from './queryKeys';

interface CurrentUserResponse extends User {
  forceChangePassword: boolean;
}

export function useLoadCurrentUser({ staleTime }: { staleTime?: number } = {}) {
  return useQuery(userQueryKeys.me(), () => getCurrentUser(), {
    ...withError('Unable to retrieve user details'),
    staleTime,
  });
}

export async function getCurrentUser() {
  try {
    const { data: user } = await axios.get<CurrentUserResponse>(
      buildUrl(undefined, 'me')
    );

    return user;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve user details');
  }
}
