import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { configMapQueryKeys } from './query-keys';
import { ConfigMapQueryParams } from './types';

export function useConfigMapsForCluster(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number } & ConfigMapQueryParams
) {
  const { autoRefreshRate, ...params } = options ?? {};
  return useQuery(
    configMapQueryKeys.configMapsForCluster(environmentId, params),
    () => getConfigMapsForCluster(environmentId, params),
    {
      ...withError('Unable to retrieve ConfigMaps for cluster'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// get all configmaps for a cluster
async function getConfigMapsForCluster(
  environmentId: EnvironmentId,
  params?: { withData?: boolean; isUse?: boolean }
) {
  try {
    const { data } = await axios.get<Configuration[]>(
      `/kubernetes/${environmentId}/configmaps`,
      { params }
    );
    return data;
  } catch (e) {
    // use parseAxiosError instead of parseKubernetesAxiosError
    // because this is an internal portainer api endpoint, not through the kube proxy
    throw parseAxiosError(e, 'Unable to retrieve ConfigMaps');
  }
}