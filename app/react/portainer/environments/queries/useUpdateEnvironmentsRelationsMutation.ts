import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { TagId } from '@/portainer/tags/types';
import { queryKeys as edgeGroupQueryKeys } from '@/react/edge/edge-groups/queries/query-keys';
import { queryKeys as groupQueryKeys } from '@/react/portainer/environments/environment-groups/queries/query-keys';
import { tagKeys } from '@/portainer/tags/queries';

import { EnvironmentId } from '../types';
import { buildUrl } from '../environment.service/utils';
import { EnvironmentGroupId } from '../environment-groups/types';

import { queryKeys } from './query-keys';

export function useUpdateEnvironmentsRelationsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateEnvironmentRelations,
    mutationOptions(
      withInvalidate(queryClient, [
        queryKeys.base(),
        edgeGroupQueryKeys.base(),
        groupQueryKeys.base(),
        tagKeys.all,
      ]),
      withError('Unable to update environment relations')
    )
  );
}

export interface EnvironmentRelationsPayload {
  edgeGroups: Array<EdgeGroup['Id']>;
  group: EnvironmentGroupId;
  tags: Array<TagId>;
}

export async function updateEnvironmentRelations(
  relations: Record<EnvironmentId, EnvironmentRelationsPayload>
) {
  try {
    await axios.put(buildUrl(undefined, 'relations'), { relations });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update environment relations');
  }
}
