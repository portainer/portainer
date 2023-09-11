import { useTeams } from '@/react/portainer/users/teams/queries';
import { useUsers } from '@/portainer/users/queries';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function useLoadState(environmentId?: EnvironmentId, enabled = true) {
  const teams = useTeams(false, environmentId);
  const users = useUsers(false, environmentId, enabled);

  return {
    teams: teams.data,
    users: users.data,
    isLoading: teams.isLoading || users.isLoading,
  };
}
