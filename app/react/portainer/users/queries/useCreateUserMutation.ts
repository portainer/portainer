import { useQueryClient, useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';
import { buildUrl } from '@/portainer/users/user.service';
import { Role, User } from '@/portainer/users/types';

import { TeamId, TeamRole } from '../teams/types';
import { createTeamMembership } from '../teams/queries';

interface CreateUserPayload {
  username: string;
  password: string;
  role: Role;
  teams: Array<TeamId>;
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    async (values: CreateUserPayload) => {
      const user = await createUser(values);
      return Promise.all(
        values.teams.map((id) =>
          createTeamMembership(user.Id, id, TeamRole.Member)
        )
      );
    },
    mutationOptions(
      withInvalidate(queryClient, [userQueryKeys.base()]),
      withError('Unable to create user')
    )
  );
}

async function createUser(payload: CreateUserPayload) {
  try {
    const { data } = await axios.post<User>(buildUrl(), payload);
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create user');
  }
}
