import { UserId } from '@/portainer/users/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { TeamId, TeamRole, TeamMembershipId } from './types';

export async function createTeamMembership(
  userId: UserId,
  teamId: TeamId,
  role: TeamRole
) {
  try {
    await axios.post(buildUrl(), { userId, teamId, role });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create team membership');
  }
}

export async function deleteTeamMembership(id: TeamMembershipId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete team membership');
  }
}

export async function updateTeamMembership(
  id: TeamMembershipId,
  userId: UserId,
  teamId: TeamId,
  role: TeamRole
) {
  try {
    await axios.put(buildUrl(id), { userId, teamId, role });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update team membership');
  }
}

function buildUrl(id?: TeamMembershipId) {
  let url = '/team_memberships';

  if (id) {
    url += `/${id}`;
  }

  return url;
}
