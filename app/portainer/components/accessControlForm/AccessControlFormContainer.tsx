import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { getTeams } from '@/portainer/teams/teams.service';
import * as notifications from '@/portainer/services/notifications';
import { getUsers } from '@/portainer/services/api/userService';

import { AccessControlForm, type BaseProps } from './AccessControlForm';

export function AccessControlFormContainer(props: BaseProps) {
  const { teams, isLoading: isLoadingTeams } = useTeams();

  const { users, isLoading: isLoadingUsers } = useUsers();

  if (isLoadingTeams || isLoadingUsers) {
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <AccessControlForm teams={teams} users={users} {...props} />;
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

  return { isLoading, teams: data || [] };
}

function useUsers() {
  const { isError, error, isLoading, data } = useQuery('users', () =>
    getUsers()
  );

  useEffect(() => {
    if (isError) {
      notifications.error('Failure', error as Error, 'Failed retrieving users');
    }
  }, [isError, error]);

  return { isLoading, users: data || [] };
}
