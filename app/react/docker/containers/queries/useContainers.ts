import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { DockerContainerResponse } from '../types/response';
import { toListViewModel } from '../utils';
import { ContainerListViewModel } from '../types';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import {
  withFiltersQueryParam,
  withAgentTargetHeader,
} from '../../proxy/queries/utils';

import { Filters } from './types';
import { queryKeys } from './query-keys';

interface UseContainers {
  all?: boolean;
  filters?: Filters;
  nodeName?: string;
}

export function useContainers<T = ContainerListViewModel[]>(
  environmentId: EnvironmentId,
  {
    autoRefreshRate,
    select,
    enabled,
    ...params
  }: UseContainers & {
    autoRefreshRate?: number;
    select?: (data: ContainerListViewModel[]) => T;
    enabled?: boolean;
  } = {}
) {
  return useQuery(
    queryKeys.filters(environmentId, params),
    () => getContainers(environmentId, params),
    {
      ...withGlobalError('Unable to retrieve containers'),
      refetchInterval: autoRefreshRate ?? false,
      select,
      enabled,
    }
  );
}

/**
 * Fetch containers and transform to ContainerListViewModel
 * @param environmentId
 * @param param1
 * @returns ContainerListViewModel[]
 */
export async function getContainers(
  environmentId: EnvironmentId,
  { all = true, filters, nodeName }: UseContainers = {}
) {
  try {
    const { data } = await axios.get<DockerContainerResponse[]>(
      buildDockerProxyUrl(environmentId, 'containers', 'json'),
      {
        params: { all, ...withFiltersQueryParam(filters) },
        headers: { ...withAgentTargetHeader(nodeName) },
      }
    );
    return data.map((c) => toListViewModel(c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
