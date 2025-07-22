import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { HelmRelease } from '../types';

import { queryKeys } from './query-keys';

export function useHelmHistory(
  environmentId: EnvironmentId,
  name: string,
  namespace: string
) {
  return useQuery(
    queryKeys.releaseHistory(environmentId, namespace, name),
    () => getHelmHistory(environmentId, name, namespace),
    {
      enabled: !!environmentId && !!name && !!namespace,
      ...withGlobalError('Unable to retrieve helm application history'),
      retry: 3,
      // occasionally the application shows before the release is created, take some more time to refetch
      retryDelay: 2000,
    }
  );
}

async function getHelmHistory(
  environmentId: EnvironmentId,
  name: string,
  namespace: string
) {
  try {
    const response = await axios.get<HelmRelease[]>(
      `endpoints/${environmentId}/kubernetes/helm/${name}/history`,
      {
        params: { namespace },
      }
    );

    return response.data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve helm application history');
  }
}
