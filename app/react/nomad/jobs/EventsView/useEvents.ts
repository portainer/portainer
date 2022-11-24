import { useQuery, useQueryClient } from 'react-query';
import { useCurrentStateAndParams } from '@uirouter/react';

import * as notifications from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { NomadEventsList } from '../../types';

export function useEvents() {
  const queryClient = useQueryClient();

  const {
    params: {
      endpointId: environmentID,
      allocationID,
      jobID,
      taskName,
      namespace,
    },
  } = useCurrentStateAndParams();

  if (!environmentID) {
    throw new Error('endpointId url param is required');
  }

  const key = [
    'environments',
    environmentID,
    'nomad',
    'events',
    allocationID,
    jobID,
    taskName,
    namespace,
  ];

  function invalidateQuery() {
    return queryClient.invalidateQueries(key);
  }

  const query = useQuery(
    key,
    () =>
      getTaskEvents(environmentID, allocationID, jobID, taskName, namespace),
    {
      refetchOnWindowFocus: false,
      onError: (err) => {
        notifications.error('Failed loading events', err as Error, '');
      },
    }
  );

  return { query, invalidateQuery };
}

export async function getTaskEvents(
  environmentId: EnvironmentId,
  allocationId: string,
  jobId: string,
  taskName: string,
  namespace: string
) {
  try {
    const ret = await axios.get<NomadEventsList>(
      `/nomad/endpoints/${environmentId}/allocation/${allocationId}/events`,
      {
        params: { jobId, taskName, namespace },
      }
    );
    return ret.data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
