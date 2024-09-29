import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { configMapQueryKeys } from './query-keys';
import { ConfigMapQueryParams } from './types';

export function useConfigMapsForCluster<TData = Configuration[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    select?: (data: Configuration[]) => TData;
  } & ConfigMapQueryParams
) {
  const { autoRefreshRate, select, ...params } = options ?? {};
  return useQuery(
    configMapQueryKeys.configMapsForCluster(environmentId, params),
    () =>
      getConfigMapsForCluster(environmentId, {
        ...params,
        isUsed: params?.isUsed,
      }),
    {
      ...withGlobalError('Unable to retrieve ConfigMaps for cluster'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      select,
    }
  );
}

// get all configmaps for a cluster
async function getConfigMapsForCluster(
  environmentId: EnvironmentId,
  params?: { withData?: boolean; isUsed?: boolean }
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
