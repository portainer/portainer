import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, {
  agentTargetHeader,
  parseAxiosError,
} from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { urlBuilder } from '../containers.service';
import { DockerContainerResponse } from '../types/response';
import { parseViewModel } from '../utils';

import { Filters } from './types';
import { queryKeys } from './query-keys';

export function useContainers(
  environmentId: EnvironmentId,
  {
    all = true,
    filters,
    nodeName,
  }: { all?: boolean; filters?: Filters; nodeName?: string } = {},
  {
    autoRefreshRate,
  }: {
    autoRefreshRate?: number;
  } = {}
) {
  return useQuery(
    queryKeys.filters(environmentId, { all, filters, nodeName }),
    () => getContainers(environmentId, { all, filters, nodeName }),
    {
      ...withGlobalError('Unable to retrieve containers'),
      refetchInterval() {
        return autoRefreshRate ?? false;
      },
    }
  );
}

async function getContainers(
  environmentId: EnvironmentId,
  {
    all = true,
    filters,
    nodeName,
  }: { all?: boolean; filters?: Filters; nodeName?: string } = {}
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
    return data.map((c) => parseViewModel(c));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve containers');
  }
}
