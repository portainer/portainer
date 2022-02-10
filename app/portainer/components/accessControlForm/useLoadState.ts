import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { getTeams } from '@/portainer/teams/teams.service';
import * as notifications from '@/portainer/services/notifications';
import { getUsers } from '@/portainer/services/api/userService';
import { UserViewModel } from '@/portainer/models/user';

export function useLoadState() {
  const { teams, isLoading: isLoadingTeams } = useTeams();

  const { users, isLoading: isLoadingUsers } = useUsers();

  return { teams, users, isLoading: isLoadingTeams || isLoadingUsers };
}

function useTeams() {
  const { isError, error, isLoading, data } = useQuery('teams', () =>
    getTeams()
  );

  useEffect(() => {
    if (isError) {
      notifications.error('Failure', error as Error, 'Failed retrieving teams');
    }
  }, [isError, error]);

  return { isLoading, teams: data };
}

function useUsers() {
  const { isError, error, isLoading, data } = useQuery<
    unknown,
    unknown,
    UserViewModel[]
  >('users', () => getUsers());

  useEffect(() => {
    if (isError) {
      notifications.error('Failure', error as Error, 'Failed retrieving users');
    }
  }, [isError, error]);

  return { isLoading, users: data };
}
