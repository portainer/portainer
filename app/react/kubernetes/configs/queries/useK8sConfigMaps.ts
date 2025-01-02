import { ConfigMap, ConfigMapList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { parseKubernetesAxiosError } from '../../axiosError';

export const configMapQueryKeys = {
  configMaps: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'configmaps',
    'namespaces',
    namespace,
  ],
};

/**
 * returns a usequery hook for the list of configmaps from the kubernetes API
 */
export function useK8sConfigMaps(
  environmentId: EnvironmentId,
  namespace?: string
) {
  return useQuery(
    configMapQueryKeys.configMaps(environmentId, namespace),
    () => (namespace ? getConfigMaps(environmentId, namespace) : []),
    {
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          `Unable to get ConfigMaps in namespace '${namespace}'`
        );
      },
      enabled: !!namespace,
    }
  );
}

// get all configmaps for a namespace
async function getConfigMaps(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<ConfigMapList>(
      buildUrl(environmentId, namespace)
    );
    const configMapsWithKind: ConfigMap[] = data.items.map((configmap) => ({
      ...configmap,
      kind: 'ConfigMap',
    }));
    return configMapsWithKind;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve ConfigMaps');
  }
}

function buildUrl(environmentId: number, namespace: string, name?: string) {
  const url = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/configmaps`;
  return name ? `${url}/${name}` : url;
}
