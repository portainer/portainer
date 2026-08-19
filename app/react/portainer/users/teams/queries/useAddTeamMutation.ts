import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { UserId } from '@/portainer/users/types';
import { withError, withInvalidate } from '@/react-tools/react-query';

import { TeamRole } from '../types';

import { createTeamMembership } from './useAddMemberMutation';
import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface CreatePayload {
  name: string;
  leaders: UserId[];
}

export function useAddTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeam,
    ...withError('Failed to create team'),
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

async function createTeam({ name, leaders }: CreatePayload) {
  try {
    const { data: team } = await axios.post(buildUrl(), { name });
    await Promise.all(
      leaders.map((leaderId) =>
        createTeamMembership(leaderId, team.Id, TeamRole.Leader)
      )
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create team');
  }
}
