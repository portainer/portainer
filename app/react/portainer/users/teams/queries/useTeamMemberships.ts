import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { TeamId, TeamMembership } from '../types';

import { buildUrl } from './build-url';

export function useTeamMemberships(id: TeamId) {
  return useQuery(['teams', id, 'memberships'], () => getTeamMemberships(id), {
    meta: {
      error: { title: 'Failure', message: 'Unable to load team memberships' },
    },
  });
}

async function getTeamMemberships(teamId: TeamId) {
  try {
    const { data } = await axios.get<TeamMembership[]>(
      buildUrl(teamId, 'memberships')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get team memberships');
  }
}
