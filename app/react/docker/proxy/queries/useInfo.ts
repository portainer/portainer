import { useQuery } from 'react-query';
import { SystemInfo } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export async function getInfo(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<SystemInfo>(
      buildDockerProxyUrl(environmentId, 'info')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve system info');
  }
}

export function useInfo<TSelect = SystemInfo>(
  environmentId: EnvironmentId,
  select?: (info: SystemInfo) => TSelect
) {
  return useQuery(
    ['environment', environmentId, 'docker', 'info'],
    () => getInfo(environmentId),
    {
      select,
    }
  );
}

export function useIsWindows(environmentId: EnvironmentId) {
  const query = useInfo(environmentId, (info) => info.OSType === 'windows');

  return !!query.data;
}

export function useIsStandAlone(environmentId: EnvironmentId) {
  const query = useInfo(environmentId, (info) => !info.Swarm?.NodeID);

  return !!query.data;
}

export function useIsSwarm(environmentId: EnvironmentId) {
  const query = useInfo(environmentId, (info) => !!info.Swarm?.NodeID);

  return !!query.data;
}

export function useSystemLimits(environmentId: EnvironmentId) {
  const infoQuery = useInfo(environmentId);

  const maxCpu = infoQuery.data?.NCPU || 32;
  const maxMemory = infoQuery.data?.MemTotal
    ? Math.floor(infoQuery.data.MemTotal / 1000 / 1000)
    : 32768;

  return { maxCpu, maxMemory };
}
