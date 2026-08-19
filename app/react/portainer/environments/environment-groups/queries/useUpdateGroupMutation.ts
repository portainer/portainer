import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { TagId } from '@/portainer/tags/types';
import { withError } from '@/react-tools/react-query';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';
import { notifySuccess } from '@/portainer/services/notifications';

import { EnvironmentGroupId, EnvironmentId } from '../../types';
import { EnvironmentGroup } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface UpdateGroupPayload {
  id: EnvironmentGroupId;
  name: string;
  description?: string;
  tagIds?: Array<TagId>;
  associatedEnvironments?: Array<EnvironmentId>;
}

export async function updateGroup({
  id,
  name,
  description,
  tagIds,
  associatedEnvironments,
}: UpdateGroupPayload) {
  try {
    const { data: group } = await axios.put<EnvironmentGroup>(buildUrl(id), {
      Name: name,
      Description: description,
      TagIDs: tagIds,
      AssociatedEndpoints: associatedEnvironments,
    });
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to update group');
  }
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroup,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.base());
      queryClient.invalidateQueries(queryKeys.list(true));
      queryClient.invalidateQueries(environmentQueryKeys.base());
      notifySuccess('Success', 'Group successfully updated');
    },
    ...withError('Failed to update group'),
  });
}
