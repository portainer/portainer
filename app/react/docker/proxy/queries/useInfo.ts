import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';

export interface PluginInfoResponse {
  Volume: Array<string>;
  Network: Array<string>;
  Authorization: Array<string>;
  Log: Array<string>;
}

/**
 * https://docs.docker.com/engine/api/v1.42/#tag/System/operation/SystemInfo
 */
export interface InfoResponse {
  Swarm?: {
    NodeID: string;
    ControlAvailable: boolean;
  };
  Plugins: PluginInfoResponse;
}

export async function getInfo(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<InfoResponse>(
      buildUrl(environmentId, 'info')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve version');
  }
}

export function useInfo<TSelect = InfoResponse>(
  environmentId: EnvironmentId,
  select?: (info: InfoResponse) => TSelect
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'info'],
    () => getInfo(environmentId),
    {
      select,
    }
  );
}
