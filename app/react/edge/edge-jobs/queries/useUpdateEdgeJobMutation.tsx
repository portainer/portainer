import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withInvalidate } from '@/react-tools/react-query';

import { EdgeGroup } from '../../edge-groups/types';

import { queryKeys } from './query-keys';

export interface UpdatePayload {
  name?: string;
  cronExpression?: string;
  recurring?: boolean;
  endpoints?: Array<EnvironmentId>;
  edgeGroups?: Array<EdgeGroup['Id']>;
  fileContent?: string;
}

export function useUpdateEdgeJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEdgeJob,
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

async function updateEdgeJob({
  id,
  payload,
}: {
  id: number;
  payload: UpdatePayload;
}) {
  try {
    await axios.put(`/edge_jobs/${id}`, payload);
  } catch (error) {
    throw parseAxiosError(error);
  }
}
