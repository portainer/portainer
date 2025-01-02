import { useQuery } from '@tanstack/react-query';

import { TeamRole, TeamMembership } from '@/react/portainer/users/teams/types';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';

import { User, UserId } from './types';
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

export function useIsCurrentUserTeamLeader() {
  const { user } = useCurrentUser();
  const isAdminQuery = useIsEdgeAdmin();

  const query = useUserMembership(user.Id, {
    enabled: !isAdminQuery.isLoading && !isAdminQuery.isAdmin,
    select: (memberships) =>
      memberships.some((membership) => membership.Role === TeamRole.Leader),
  });

  if (isAdminQuery.isLoading) {
    return false;
  }

  return isAdminQuery.isAdmin ? true : !!query.data;
}

export function useUsers<T = User[]>(
  includeAdministrator = false,
  environmentId = 0,
  enabled = true,
  select: (data: User[]) => T = (data) => data as unknown as T
) {
  const users = useQuery(
    ['users', { includeAdministrator, environmentId }],
    () => getUsers(includeAdministrator, environmentId),
    {
      meta: {
        error: { title: 'Failure', message: 'Unable to load users' },
      },
      enabled,
      select,
    }
  );

  return users;
}
