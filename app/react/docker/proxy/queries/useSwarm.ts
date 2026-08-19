import { useQuery } from '@tanstack/react-query';
import { Swarm } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';
import { useIsSwarmManager } from './useInfo';
import { buildDockerProxyUrl } from './buildDockerProxyUrl';

export function useSwarm<T = Swarm>(
  environmentId: EnvironmentId,
  { select }: { select?(value: Swarm): T } = {}
) {
  // Swarm info is only available from a manager node; querying it on a worker
  // returns 503, so gate the query on manager rather than swarm membership.
  const isSwarmManager = useIsSwarmManager(environmentId);

  return useQuery({
    queryKey: [...queryKeys.base(environmentId), 'swarm'] as const,
    queryFn: () => getSwarm(environmentId),
    select,
    enabled: isSwarmManager,
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
