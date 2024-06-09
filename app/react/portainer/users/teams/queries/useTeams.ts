import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Team } from '../types';

import { buildUrl } from './build-url';

export function useTeams<T = Team[]>(
  onlyLedTeams = false,
  environmentId = 0,
  {
    enabled = true,
    select = (data) => data as unknown as T,
  }: {
    enabled?: boolean;
    select?: (data: Team[]) => T;
  } = {}
) {
  const teams = useQuery(
    ['teams', { onlyLedTeams, environmentId }],
    () => getTeams(onlyLedTeams, environmentId),
    {
      meta: {
        error: { title: 'Failure', message: 'Unable to load teams' },
      },
      enabled,
      select,
    }
  );

  return teams;
}

async function getTeams(onlyLedTeams = false, environmentId = 0) {
  try {
    const { data } = await axios.get<Team[]>(buildUrl(), {
      params: { onlyLedTeams, environmentId },
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
