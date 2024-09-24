import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ContainerId } from '../types';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

import { queryKeys } from './query-keys';
import { ContainerProcesses } from './types';

export function useContainerTop<T = ContainerProcesses>(
  environmentId: EnvironmentId,
  id: ContainerId,
  select?: (environment: ContainerProcesses) => T
) {
  // many containers don't allow this call, so fail early, and omit withError to silently fail
  return useQuery({
    queryKey: queryKeys.top(environmentId, id),
    queryFn: () => getContainerTop(environmentId, id),
    retry: false,
    select,
  });
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getContainerTop(
  environmentId: EnvironmentId,
  id: ContainerId
) {
  try {
    const { data } = await axios.get<ContainerProcesses>(
      buildDockerProxyUrl(environmentId, 'containers', id, 'top')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve container top');
  }
}
