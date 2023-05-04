import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

export interface VersionResponse {
  ApiVersion: string;
}

export async function getVersion(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<VersionResponse>(
      buildUrl(environmentId, 'version')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve version');
  }
}

export interface InfoResponse {
  Swarm?: {
    NodeID: string;
    ControlAvailable: boolean;
  };
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
export function useVersion<TSelect = VersionResponse>(
  environmentId: EnvironmentId,
  select?: (info: VersionResponse) => TSelect
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'version'],
    () => getVersion(environmentId),
    {
      select,
    }
  );
}

function buildUrl(
  environmentId: EnvironmentId,
  action: string,
  subAction = ''
) {
  let url = `/endpoints/${environmentId}/docker/${action}`;

  if (subAction) {
    url += `/${subAction}`;
  }

  return url;
}
