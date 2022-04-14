import { useTeams } from '@/portainer/teams/queries';
import { useUsers } from '@/portainer/users/queries';

export function useLoadState() {
  const teams = useTeams();

  const users = useUsers(false);

  return {
    teams: teams.data,
    users: users.data,
    isLoading: teams.isLoading || users.isLoading,
  };
}
