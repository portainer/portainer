import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { UserId } from '@/portainer/users/types';

import { TeamRole } from '../types';

import { createTeamMembership } from './useAddMemberMutation';
import { buildUrl } from './build-url';

interface CreatePayload {
  name: string;
  leaders: UserId[];
}

export function useAddTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation(createTeam, {
    meta: {
      error: {
        title: 'Failure',
        message: 'Failed to create team',
      },
    },
    onSuccess() {
      return queryClient.invalidateQueries(['teams']);
    },
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
