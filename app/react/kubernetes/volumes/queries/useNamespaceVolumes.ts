import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { K8sVolumeInfo } from '../types';

import { queryKeys } from './query-keys';
import { convertToVolumeViewModels } from './useVolumesQuery';

// useQuery to get a list of all volumes in a cluster
export function useNamespaceVolumes(
  environmentId: EnvironmentId,
  namespace: string,
  queryOptions?: {
    refetchInterval?: number;
    withApplications?: boolean;
  }
) {
  return useQuery(
    queryKeys.volumes(environmentId),
    () =>
      getNamespaceVolumes(environmentId, namespace, {
        withApplications: queryOptions?.withApplications ?? false,
      }),
    {
      enabled: !!namespace,
      refetchInterval: queryOptions?.refetchInterval,
      select: convertToVolumeViewModels,
      ...withGlobalError('Unable to retrieve volumes'),
    }
  );
}

// get all volumes in a cluster
async function getNamespaceVolumes(
  environmentId: EnvironmentId,
  namespace: string,
  params?: { withApplications: boolean }
) {
  try {
    const { data } = await axios.get<K8sVolumeInfo[]>(
      `/kubernetes/${environmentId}/namespaces/${namespace}/volumes`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve volumes');
  }
}
