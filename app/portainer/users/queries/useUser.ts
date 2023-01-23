import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from '../user.service';
import { User, UserId } from '../types';

export function useUser(
  id: UserId,
  { staleTime }: { staleTime?: number } = {}
) {
  return useQuery(['users', id], () => getUser(id), {
    ...withError('Unable to retrieve user details'),
    staleTime,
  });
}

export async function getUser(id: UserId) {
  try {
    const { data: user } = await axios.get<User>(buildUrl(id));

    return user;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve user details');
  }
}
