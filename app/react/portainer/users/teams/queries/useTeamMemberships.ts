import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { TeamId, TeamMembership } from '../types';

import { buildUrl } from './build-url';
import { buildMembershipUrl } from './build-membership-url';
import { queryKeys } from './query-keys';

export function useTeamMemberships(id?: TeamId) {
  return useQuery({
    queryKey: queryKeys.memberships(id),
    queryFn: () => (id ? getTeamMemberships(id) : getTeamsMemberships()),
    ...withGlobalError('Unable to load team memberships'),
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

async function getTeamsMemberships() {
  try {
    const { data } = await axios.get<TeamMembership[]>(buildMembershipUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get team memberships');
  }
}
