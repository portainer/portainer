import { Pod, PodList } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../../axiosError';

export async function getPods(
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
