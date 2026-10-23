import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { TagId } from '@/portainer/tags/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { EnvironmentId } from '../../types';
import { EnvironmentGroup } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface CreateGroupPayload {
  name: string;
  description?: string;
  associatedEnvironments?: EnvironmentId[];
  tagIds?: TagId[];
}

export async function createGroup({
  name,
  description,
  associatedEnvironments,
  tagIds,
}: CreateGroupPayload) {
  try {
    const { data: group } = await axios.post<EnvironmentGroup>(buildUrl(), {
      Name: name,
      Description: description,
      AssociatedEndpoints: associatedEnvironments,
      TagIDs: tagIds,
    });
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to create group');
  }
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createGroup,
    mutationOptions(
      withError('Failed to create group'),
      withInvalidate(queryClient, [queryKeys.base(), queryKeys.list(true)])
    )
  );
}
