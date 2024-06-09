import { useQueryClient, useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { notifyError } from '@/portainer/services/notifications';
import { UserId } from '@/portainer/users/types';

import { TeamId, TeamMembership, TeamRole, TeamMembershipId } from '../types';

import { buildMembershipUrl } from './build-membership-url';

export function useUpdateRoleMutation(
  teamId: TeamId,
  teamMemberships: TeamMembership[] = []
) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ userId, role }: { userId: UserId; role: TeamRole }) => {
      const membership = teamMemberships.find(
        (membership) => membership.UserID === userId
      );
      if (!membership) {
        throw new Error('Membership not found');
      }
      return updateTeamMembership(membership.Id, userId, teamId, role);
    },
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failure to update membership');
      },
      onSuccess() {
        queryClient.invalidateQueries(['teams', teamId, 'memberships']);
      },
    }
  );
}

async function updateTeamMembership(
  id: TeamMembershipId,
  userId: UserId,
  teamId: TeamId,
  role: TeamRole
) {
  try {
    await axios.put(buildMembershipUrl(id), { userId, teamId, role });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update team membership');
  }
}
