import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EdgeStack } from '@/react/edge/edge-stacks/types';

import { queryKeys } from '../../queries/query-keys';

export function logsStatusQueryKey(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  return [...queryKeys.item(edgeStackId), 'logs', environmentId] as const;
}

export function useLogsStatus(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  return useQuery(
    logsStatusQueryKey(edgeStackId, environmentId),
    () => getLogsStatus(edgeStackId, environmentId),
    {
      refetchInterval(status) {
        if (status === 'pending') {
          return 30 * 1000;
        }

        return false;
      },
    }
  );
}

interface LogsStatusResponse {
  status: 'collected' | 'idle' | 'pending';
}

async function getLogsStatus(
  edgeStackId: EdgeStack['Id'],
  environmentId: EnvironmentId
) {
  try {
    const { data } = await axios.get<LogsStatusResponse>(
      `/edge_stacks/${edgeStackId}/logs/${environmentId}`
    );
    return data.status;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve logs status');
  }
}
