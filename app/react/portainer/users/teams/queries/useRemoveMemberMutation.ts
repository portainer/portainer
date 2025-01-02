import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { UserId } from '@/portainer/users/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';

import { TeamId, TeamMembership, TeamMembershipId } from '../types';

import { buildMembershipUrl } from './build-membership-url';
import { queryKeys } from './query-keys';

export function useRemoveMemberMutation(
  teamId: TeamId,
  teamMemberships: TeamMembership[] = []
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: UserId[]) =>
      promiseSequence(
        userIds.map((userId) => () => {
          const membership = teamMemberships.find(
            (membership) => membership.UserID === userId
          );
          if (!membership) {
            throw new Error('Membership not found');
          }
          return deleteTeamMembership(membership.Id);
        })
      ),
    ...withGlobalError('Failure to remove membership'),
    ...withInvalidate(queryClient, [queryKeys.memberships(teamId)]),
  });
}

async function deleteTeamMembership(id: TeamMembershipId) {
  try {
    await axios.delete(buildMembershipUrl(id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete team membership');
  }
}
