import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { configMapQueryKeys } from './query-keys';
import { ConfigMapQueryParams } from './types';

export function useConfigMap(
  environmentId: EnvironmentId,
  namespace: string,
  configMap: string,
  options?: { autoRefreshRate?: number } & ConfigMapQueryParams
) {
  return useQuery(
    configMapQueryKeys.configMap(environmentId, namespace, configMap),
    () => getConfigMap(environmentId, namespace, configMap, { withData: true }),
    {
      ...withGlobalError('Unable to retrieve ConfigMaps for cluster'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// get a configmap
async function getConfigMap(
  environmentId: EnvironmentId,
  namespace: string,
  configMap: string,
  params?: { withData?: boolean }
) {
  try {
    const { data } = await axios.get<Configuration[]>(
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
