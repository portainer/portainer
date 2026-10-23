import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys } from '@/react/kubernetes/volumes/queries/query-keys';
import { withError } from '@/react-tools/react-query';
import { PersistentVolume } from '@/react/kubernetes/volumes/ListView/types';
import axios from '@/react/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

export function usePersistentVolumes<T = PersistentVolume>(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
    select?: (volumes: PersistentVolume[]) => T[];
  }
) {
  return useQuery(
    queryKeys.volumes(environmentId),
    () => getPersistentVolumes(environmentId, { withApplications: true }),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: queryOptions?.select,
      ...withError('Unable to retrieve persistent volumes'),
    }
  );
}

async function getPersistentVolumes(
  environmentId: EnvironmentId,
  params?: { withApplications: boolean }
) {
  try {
    const { data } = await axios.get<PersistentVolume[]>(
      `/kubernetes/${environmentId}/persistent_volumes`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve persistent volumes');
  }
}
