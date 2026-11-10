import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  PortainerTeamAccessPolicies,
  PortainerUserAccessPolicies,
} from '@api/types.gen';
import { endpointGroupUpdate } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import { EnvironmentGroupId } from '../../types';

import { queryKeys } from './query-keys';

interface UpdateGroupAccessPayload {
  id: EnvironmentGroupId;
  userAccessPolicies: PortainerUserAccessPolicies;
  teamAccessPolicies: PortainerTeamAccessPolicies;
}

async function updateGroupAccess({
  id,
  userAccessPolicies,
  teamAccessPolicies,
}: UpdateGroupAccessPayload) {
  await endpointGroupUpdate({
    path: { id },
    body: {
      UserAccessPolicies: userAccessPolicies,
      TeamAccessPolicies: teamAccessPolicies,
    },
  });
}

export function useUpdateGroupAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroupAccess,
    onSuccess: () => queryClient.invalidateQueries(queryKeys.base()),
    ...withError('Unable to update group access'),
  });
}
