import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, {
  agentTargetHeader,
  parseAxiosError,
} from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { urlBuilder } from '../containers.service';
import { DockerContainerResponse } from '../types/response';
import { parseListViewModel } from '../utils';
import { DockerContainer } from '../types';

import { Filters } from './types';
import { queryKeys } from './query-keys';

interface UseContainers {
  all?: boolean;
  filters?: Filters;
  nodeName?: string;
}

export function useContainers<T = DockerContainer[]>(
  environmentId: EnvironmentId,
  {
    autoRefreshRate,
    select,
    ...params
  }: UseContainers & {
    autoRefreshRate?: number;
    select?: (data: DockerContainer[]) => T;
  } = {}
) {
  return useQuery(
    queryKeys.filters(environmentId, params),
    () => getContainers(environmentId, params),
    {
      ...withGlobalError('Unable to retrieve containers'),
      refetchInterval() {
        return autoRefreshRate ?? false;
      },
      select,
    }
  );
}

export async function getContainers(
  environmentId: EnvironmentId,
  { all = true, filters, nodeName }: UseContainers = {}
) {
  try {
    const { data } = await axios.get<DockerContainerResponse[]>(
      urlBuilder(environmentId, undefined, 'json'),
      {
        params: { all, filters: filters && JSON.stringify(filters) },
        headers: nodeName
          ? {
              [agentTargetHeader]: nodeName,
            }
          : undefined,
      }
    );
    return data.map((c) => parseListViewModel(c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
