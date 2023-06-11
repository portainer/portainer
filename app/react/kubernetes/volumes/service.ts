import { PersistentVolumeClaimList } from 'kubernetes-types/core/v1';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getPVCsForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  try {
    const pvcs = await Promise.all(
      namespaces.map((namespace) => getPVCs(environmentId, namespace))
    );
    return pvcs.flat();
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve persistent volume claims for cluster'
    );
  }
}

// get all persistent volume claims for a namespace
export async function getPVCs(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<PersistentVolumeClaimList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/persistentvolumeclaims`
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve persistent volume claims'
    );
  }
}
