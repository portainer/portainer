import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { Team } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

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
  const teams = useQuery({
    queryKey: queryKeys.list({ onlyLedTeams, environmentId }),
    queryFn: () => getTeams(onlyLedTeams, environmentId),
    ...withGlobalError('Unable to load teams'),
    enabled,
    select,
  });

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
