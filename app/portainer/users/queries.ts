import { useQuery } from 'react-query';

import { User, UserId } from './types';
import { getUserMemberships, getUsers } from './user.service';

export function useUserMembership(userId?: UserId) {
  return useQuery(
    ['users', userId, 'memberships'],
    () => getUserMemberships(userId),
    { enabled: !!userId }
  );
}

export function useUsers<T = User[]>(
  includeAdministrator: boolean,
  enabled = true,
  select: (data: User[]) => T = (data) => data as unknown as T
) {
  const users = useQuery(['users'], () => getUsers(includeAdministrator), {
    meta: {
      error: { title: 'Failure', message: 'Unable to load users' },
    },
    enabled,
    select,
  });

  return users;
}
