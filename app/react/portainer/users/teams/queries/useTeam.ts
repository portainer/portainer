import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { Team, TeamId } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useTeam(id: TeamId, onError?: (error: unknown) => void) {
  return useQuery({
    queryKey: queryKeys.item(id),
    queryFn: () => getTeam(id),
    ...withError('Unable to load team'),
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
