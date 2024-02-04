import { useTeams } from '@/react/portainer/users/teams/queries';
import { useUsers } from '@/portainer/users/queries';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useIsAdmin } from '@/react/hooks/useUser';

export function useLoadState(environmentId: EnvironmentId) {
  const isAdminQuery = useIsAdmin();
  const teams = useTeams(false, environmentId);

  const users = useUsers(false, environmentId, isAdminQuery.isAdmin);

  return {
    teams: teams.data,
    users: users.data,
    isAdmin: isAdminQuery.isAdmin,
    isLoading: teams.isLoading || users.isLoading || isAdminQuery.isLoading,
  };
}
