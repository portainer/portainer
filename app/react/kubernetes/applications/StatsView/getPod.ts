import { Pod } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios/axios';

import { parseKubernetesAxiosError } from '../../axiosError';

export async function getPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  try {
    const { data } = await axios.get<Pod>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods/${podName}`
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, `Unable to retrieve pod '${podName}'`);
  }
}
