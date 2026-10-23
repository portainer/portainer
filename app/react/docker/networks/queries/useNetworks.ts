import { useQuery } from '@tanstack/react-query';
import { IPAMConfig, Network } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { withFiltersQueryParam } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { PortainerResponse } from '../../types';
import { DockerNetwork, IPConfig, NetworkResponseContainers } from '../types';

import { queryKeys } from './queryKeys';
import { NetworksQuery } from './types';

export type NetworkListResponseItem = PortainerResponse<
  Network & {
    ConfigFrom?: { Network: string };
    ConfigOnly?: boolean;
  }
>;

export function useNetworks<T = Array<DockerNetwork>>(
  environmentId: EnvironmentId,
  query: NetworksQuery,
  {
    enabled = true,
    onSuccess,
    select,
    autoRefreshRate,
  }: {
    enabled?: boolean;
    onSuccess?(networks: T): void;
    select?(networks: Array<DockerNetwork>): T;
    autoRefreshRate?: number;
  } = {}
) {
  return useQuery(
    queryKeys.list(environmentId, query),
    () => getNetworks(environmentId, query),
    {
      enabled,
      onSuccess,
      select,

      refetchInterval: autoRefreshRate ?? false,
      ...withError('Unable to retrieve networks'),
    }
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
    const { data } = await axios.get<Array<NetworkListResponseItem>>(
      buildDockerProxyUrl(environmentId, 'networks'),
      {
        params: { ...withFiltersQueryParam(filters) },
      }
    );

    const parsed = data.map(toDockerNetwork);

    return !local && !swarm && !swarmAttachable
      ? parsed
      : parsed.filter(
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

function toDockerNetwork(req: NetworkListResponseItem): DockerNetwork {
  return {
    ...req,

    Name: req.Name || '',
    Id: req.Id || '',
    Driver: req.Driver || '',
    Scope: req.Scope || '',
    Attachable: req.Attachable ?? false,
    Internal: req.Internal ?? false,
    IPAM: toIpam(req.IPAM),
    Options: req.Options ?? {},
    Containers: toContainers(req.Containers),
  };

  function toContainers(
    req: NetworkListResponseItem['Containers']
  ): NetworkResponseContainers {
    if (!req) return {};
    return Object.fromEntries(
      Object.entries(req).map(([id, c]) => [
        id,
        {
          EndpointID: c.EndpointID ?? '',
          IPv4Address: c.IPv4Address ?? '',
          IPv6Address: c.IPv6Address ?? '',
          MacAddress: c.MacAddress ?? '',
          Name: c.Name ?? '',
        },
      ])
    );
  }

  function toIpam(req: NetworkListResponseItem['IPAM']): DockerNetwork['IPAM'] {
    if (!req) {
      return {
        Config: [],
        Driver: '',
        Options: {},
      };
    }

    return {
      Config: req.Config?.map(toIpamConfig) || [],
      Driver: req.Driver || '',
      Options: req.Options,
    };
  }

  function toIpamConfig(req: IPAMConfig): IPConfig {
    return {
      ...req,
      Subnet: req.Subnet ?? '',
      Gateway: req.Gateway ?? '',
    };
  }
}
