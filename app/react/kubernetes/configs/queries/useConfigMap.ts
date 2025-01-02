import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { configMapQueryKeys } from './query-keys';
import { ConfigMapQueryParams } from './types';

export function useConfigMap<T = Configuration>(
  environmentId: EnvironmentId,
  namespace: string,
  configMap: string,
  options?: {
    autoRefreshRate?: number;
    select?: (data: Configuration) => T;
    enabled?: boolean;
  } & ConfigMapQueryParams
) {
  return useQuery(
    configMapQueryKeys.configMap(environmentId, namespace, configMap),
    () => getConfigMap(environmentId, namespace, configMap, { withData: true }),
    {
      select: options?.select,
      enabled: options?.enabled,
      refetchInterval: () => options?.autoRefreshRate ?? false,
      // handle error from the callers (some callers shouldn't display an error)
    }
  );
}

// get a configmap
export async function getConfigMap(
  environmentId: EnvironmentId,
  namespace: string,
  configMap: string,
  params?: { withData?: boolean }
) {
  try {
    const { data } = await axios.get<Configuration>(
      `/kubernetes/${environmentId}/namespaces/${namespace}/configmaps/${configMap}`,
      { params }
    );
    return data;
  } catch (e) {
    // use parseAxiosError instead of parseKubernetesAxiosError
    // because this is an internal portainer api endpoint, not through the kube proxy
    throw parseAxiosError(e, 'Unable to retrieve ConfigMaps');
  }
}
