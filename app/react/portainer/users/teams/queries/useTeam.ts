import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Team, TeamId } from '../types';

import { buildUrl } from './build-url';

export function useTeam(id: TeamId, onError?: (error: unknown) => void) {
  return useQuery(['teams', id], () => getTeam(id), {
    meta: {
      error: { title: 'Failure', message: 'Unable to load team' },
    },
    onError,
  });
}

async function getTeam(id: TeamId) {
  try {
    const { data } = await axios.get<Team>(buildUrl(id));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
