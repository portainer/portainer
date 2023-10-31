import { PersistentVolumeClaimList } from 'kubernetes-types/core/v1';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { parseKubernetesAxiosError } from '../axiosError';

export async function getPVCsForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  const pvcs = await Promise.all(
    namespaces.map((namespace) => getPVCs(environmentId, namespace))
  );
  return pvcs.flat();
}

// get all persistent volume claims for a namespace
export async function getPVCs(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<PersistentVolumeClaimList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/persistentvolumeclaims`
    );
    return data.items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve persistent volume claims'
    );
  }
}
