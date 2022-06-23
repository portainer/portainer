import { useQuery } from 'react-query';

import { Role as TeamRole, TeamMembership } from '../teams/types';

import { User, UserId } from './types';
import { isAdmin } from './user.helpers';
import { getUserMemberships, getUsers } from './user.service';

interface UseUserMembershipOptions<TSelect> {
  select?(userMemberships: TeamMembership[]): TSelect;
  enabled?: boolean;
}

export function useUserMembership<TSelect = TeamMembership[]>(
  userId: UserId,
  { enabled, select }: UseUserMembershipOptions<TSelect> = {}
) {
  return useQuery(
    ['users', userId, 'memberships'],
    () => getUserMemberships(userId),
    { select, enabled }
  );
}

export function useIsTeamLeader(user: User) {
  const query = useUserMembership(user.Id, {
    enabled: !isAdmin(user),
    select: (memberships) =>
      memberships.some((membership) => membership.Role === TeamRole.TeamLeader),
  });

  return isAdmin(user) ? true : query.data;
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
