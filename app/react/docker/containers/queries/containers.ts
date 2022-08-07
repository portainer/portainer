import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { urlBuilder } from '../containers.service';
import { DockerContainerResponse } from '../types/response';
import { parseViewModel } from '../utils';
import { NetworkId } from '../../networks/types';

export interface Filters {
  label?: string[];
  network?: NetworkId[];
}

export function useContainers(
  environmentId: EnvironmentId,
  all = true,
  filters?: Filters,
  autoRefreshRate?: number
) {
  return useQuery(
    ['environments', environmentId, 'docker', 'containers', { all, filters }],
    () => getContainers(environmentId, all, filters),
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
  environmentId: EnvironmentId,
  all = true,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<DockerContainerResponse[]>(
      urlBuilder(environmentId, undefined, 'json'),
      {
        params: { all, filters: filters && JSON.stringify(filters) },
      }
    );
    return data.map((c) => parseViewModel(c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
