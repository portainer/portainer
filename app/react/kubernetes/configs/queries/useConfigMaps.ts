import { useQuery } from '@tanstack/react-query';
import { ConfigMap, ConfigMapList } from 'kubernetes-types/core/v1';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

import { configMapQueryKeys } from './query-keys';

// returns a usequery hook for the list of configmaps within a namespace from the kubernetes API
export function useConfigMaps(environmentId: EnvironmentId, namespace: string) {
  return useQuery(
    configMapQueryKeys.configMaps(environmentId, namespace),
    () => (namespace ? getConfigMaps(environmentId, namespace) : []),
    {
      ...withGlobalError(
        `Unable to get ConfigMaps in namespace '${namespace}'`
      ),
      enabled: !!namespace,
    }
  );
}

// get all configmaps for a namespace
async function getConfigMaps(environmentId: EnvironmentId, namespace?: string) {
  try {
    const { data } = await axios.get<ConfigMapList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/configmaps`
    );
    // when fetching a list, the kind isn't appended to the items, so we need to add it
    const configmaps: ConfigMap[] = data.items.map((configmap) => ({
      ...configmap,
      kind: 'ConfigMap',
    }));
    return configmaps;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve ConfigMaps');
  }
}
