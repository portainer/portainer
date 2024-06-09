import { TeamMembershipId } from '../types';

export function buildMembershipUrl(id?: TeamMembershipId) {
  let url = '/team_memberships';

  if (id) {
    url += `/${id}`;
  }

  return url;
}
