import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TagId } from '@/portainer/tags/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeGroup } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface CreateGroupPayload {
  name: string;
  dynamic: boolean;
  tagIds?: TagId[];
  endpoints?: EnvironmentId[];
  partialMatch?: boolean;
}

export async function createEdgeGroup(requestPayload: CreateGroupPayload) {
  try {
    const { data: group } = await axios.post<EdgeGroup>(
      buildUrl(),
      requestPayload
    );
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to create Edge group');
  }
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createEdgeGroup,
    mutationOptions(
      withError('Failed to create Edge group'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}
