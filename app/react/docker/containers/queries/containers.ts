import { useQuery } from 'react-query';

import { Environment } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { urlBuilder } from '../containers.service';
import { DockerContainerResponse } from '../types/response';
import { parseViewModel } from '../utils';

import { Filters } from './types';
import { queryKeys } from './query-keys';

export function useContainers(
  environment: Environment,
  all = true,
  filters?: Filters,
  autoRefreshRate?: number
) {
  return useQuery(
    queryKeys.filters(environment.Id, all, filters),
    () => getContainers(environment, all, filters),
    {
      meta: {
        title: 'Failure',
        message: 'Unable to retrieve containers',
      },
      refetchInterval() {
        return autoRefreshRate ?? false;
      },
    }
  );
}

async function getContainers(
  environment: Environment,
  all = true,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<DockerContainerResponse[]>(
      urlBuilder(environment.Id, undefined, 'json'),
      {
        params: { all, filters: filters && JSON.stringify(filters) },
      }
    );
    return data.map((c) => parseViewModel(environment.URL, c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
