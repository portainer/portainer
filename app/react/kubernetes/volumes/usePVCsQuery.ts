import { useQuery } from 'react-query';
import { PersistentVolumeClaimList } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../axiosError';

// useQuery to get a list of all persistent volume claims from an array of namespaces
export function usePVCsQuery(
  environmentId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'pvcs'],
    async () => {
      if (!namespaces) {
        return [];
      }
      const pvcs = await Promise.all(
        namespaces?.map((namespace) => getPVCs(environmentId, namespace))
      );
      return pvcs.flat();
    },
    {
      ...withError('Unable to retrieve perrsistent volume claims'),
      enabled: !!namespaces,
    }
  );
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
