import { useQuery } from '@tanstack/react-query';
import { Swarm } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';
import { useIsSwarm } from './useInfo';
import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export function useSwarm<T = Swarm>(
  environmentId: EnvironmentId,
  { select }: { select?(value: Swarm): T } = {}
) {
  const isSwarm = useIsSwarm(environmentId);

  return useQuery({
    queryKey: [...queryKeys.base(environmentId), 'swarm'] as const,
    queryFn: () => getSwarm(environmentId),
    select,
    enabled: isSwarm,
  });
}

export async function getSwarm(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Swarm>(
      buildDockerProxyUrl(environmentId, 'swarm')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve swarm information');
  }
}

export function useSwarmId(environmentId: EnvironmentId) {
  return useSwarm(environmentId, {
    select: (swarm) => swarm.ID,
  });
}
