import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { notifyError } from '@/portainer/services/notifications';
import { UserId } from '@/portainer/users/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { TeamId, TeamRole } from '../types';

import { buildMembershipUrl } from './build-membership-url';

export function useAddMemberMutation(teamId: TeamId) {
  const queryClient = useQueryClient();

  return useMutation(
    (userIds: UserId[]) =>
      promiseSequence(
        userIds.map(
          (userId) => () =>
            createTeamMembership(userId, teamId, TeamRole.Member)
        )
      ),
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failure to add membership');
      },
      onSuccess() {
        queryClient.invalidateQueries(['teams', teamId, 'memberships']);
      },
    }
  );
}

export async function createTeamMembership(
  userId: UserId,
  teamId: TeamId,
  role: TeamRole
) {
  try {
    await axios.post(buildMembershipUrl(), { userId, teamId, role });
  } catch (e) {
    throw parseAxiosError(e, 'Unable to create team membership');
  }
}
