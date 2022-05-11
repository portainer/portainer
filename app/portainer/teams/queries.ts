import { useQuery } from 'react-query';

import { getTeams } from './teams.service';
import { Team } from './types';

export function useTeams<T = Team[]>(
  enabled = true,
  select: (data: Team[]) => T = (data) => data as unknown as T
) {
  const teams = useQuery(['teams'], () => getTeams(), {
    meta: {
      error: { title: 'Failure', message: 'Unable to load teams' },
    },
    enabled,
    select,
  });

  return teams;
}
