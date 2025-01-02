import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { DockerNetwork } from '../types';
import { withFiltersQueryParam } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

import { queryKeys } from './queryKeys';
import { NetworksQuery } from './types';

export function useNetworks<T = Array<DockerNetwork>>(
  environmentId: EnvironmentId,
  query: NetworksQuery,
  {
    enabled = true,
    onSuccess,
    select,
  }: {
    enabled?: boolean;
    onSuccess?(networks: T): void;
    select?(networks: Array<DockerNetwork>): T;
  } = {}
) {
  return useQuery(
    queryKeys.list(environmentId, query),
    () => getNetworks(environmentId, query),
    { enabled, onSuccess, select }
  );
}

/**
 * Raw docker API proxy
 */
export async function getNetworks(
  environmentId: EnvironmentId,
  { local, swarm, swarmAttachable, filters }: NetworksQuery
) {
  try {
    const { data } = await axios.get<Array<DockerNetwork>>(
      buildDockerProxyUrl(environmentId, 'networks'),
      {
        params: { ...withFiltersQueryParam(filters) },
      }
    );

    return !local && !swarm && !swarmAttachable
      ? data
      : data.filter(
          (network) =>
            (local && network.Scope === 'local') ||
            (swarm && network.Scope === 'swarm') ||
            (swarmAttachable &&
              network.Scope === 'swarm' &&
              network.Attachable === true)
        );
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve networks');
  }
}
