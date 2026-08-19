import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys } from '@/react/kubernetes/volumes/queries/query-keys';
import { withError } from '@/react-tools/react-query';
import { PersistentVolumeClaim } from '@/react/kubernetes/volumes/ListView/types';
import axios from '@/react/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

export function usePersistentVolumeClaims<T = PersistentVolumeClaim>(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
    select?: (claims: PersistentVolumeClaim[]) => T[];
  }
) {
  return useQuery(
    queryKeys.claims(environmentId),
    () => getPersistentVolumeClaims(environmentId),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: queryOptions?.select,
      ...withError('Unable to retrieve persistent volume claims'),
    }
  );
}

async function getPersistentVolumeClaims(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<PersistentVolumeClaim[]>(
      `/kubernetes/${environmentId}/persistent_volume_claims`
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve persistent volume claims'
    );
  }
}
