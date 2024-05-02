import { useQuery } from '@tanstack/react-query';
import { Pod, PodList } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../axiosError';

const queryKeys = {
  podsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'pods',
  ],
};

export function usePods(environemtId: EnvironmentId, namespaces?: string[]) {
  return useQuery(
    queryKeys.podsForCluster(environemtId),
    () => getPodsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve Pods'),
      enabled: !!namespaces?.length,
    }
  );
}

export async function getPodsForCluster(
  environmentId: EnvironmentId,
  namespaceNames?: string[]
) {
  if (!namespaceNames) {
    return [];
  }
  const pods = await Promise.all(
    namespaceNames.map((namespace) =>
      getNamespacePods(environmentId, namespace)
    )
  );
  return pods.flat();
}

export async function getNamespacePods(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<PodList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods`,
      {
        params: {
          labelSelector,
        },
      }
    );
    const items = (data.items || []).map(
      (pod) =>
        <Pod>{
          ...pod,
          kind: 'Pod',
          apiVersion: data.apiVersion,
        }
    );
    return items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      `Unable to retrieve Pods in namespace '${namespace}'`
    );
  }
}
