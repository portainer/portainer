import { useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { EdgeStack } from '../../types';

import { logsStatusQueryKey } from './useLogsStatus';

export function useDeleteLogsMutation() {
  const queryClient = useQueryClient();

  return useMutation(deleteLogs, {
    onSuccess(data, variables) {
      return queryClient.invalidateQueries(
        logsStatusQueryKey(variables.edgeStackId, variables.environmentId)
      );
    },
    ...withError('Unable to delete logs'),
  });
}

interface DeleteLogs {
  edgeStackId: EdgeStack['Id'];
  environmentId: EnvironmentId;
}

async function deleteLogs({ edgeStackId, environmentId }: DeleteLogs) {
  try {
    await axios.delete(`/edge_stacks/${edgeStackId}/logs/${environmentId}`, {
      responseType: 'blob',
      headers: {
        Accept: 'text/yaml',
      },
    });
  } catch (e) {
    throw parseAxiosError(e as Error, '');
  }
}
