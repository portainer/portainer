import _ from 'lodash';
import { IPAMConfig } from 'docker-types';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { NetworkViewModel } from '@/docker/models/network';
import DockerNetworkHelper from '@/docker/helpers/networkHelper';

import { useAgentNodes, AgentNode } from '../../agent/queries/useAgentNodes';
import { useIsSwarmAgent } from '../../proxy/queries/useIsSwarmAgent';
import { useNetworks } from '../queries/useNetworks';
import { useApiVersion } from '../../agent/queries/useApiVersion';

import { DecoratedNetwork } from './types';

export function useNetworksData(autoRefreshRate?: number) {
  const environmentId = useEnvironmentId();

  const networksQuery = useNetworks(
    environmentId,
    {
      local: true,
      swarm: true,
      swarmAttachable: true,
    },
    {
      select: (networks) =>
        networks.map((n) => {
          const network = new NetworkViewModel(n);
          const ipam: NetworkViewModel['IPAM'] & {
            IPV4Configs?: Array<IPAMConfig>;
            IPV6Configs?: Array<IPAMConfig>;
          } = network.IPAM ?? {};

          ipam.IPV4Configs = DockerNetworkHelper.getIPV4Configs(ipam.Config);
          ipam.IPV6Configs = DockerNetworkHelper.getIPV6Configs(ipam.Config);

          network.IPAM = ipam;
          return {
            ...network,
            IPAM: ipam,
            Subs: [],
          } satisfies DecoratedNetwork;
        }),
      autoRefreshRate,
    }
  );
  const isSwarmAgent = useIsSwarmAgent();
  const apiVersionQuery = useApiVersion(environmentId, {
    enabled: isSwarmAgent,
  });
  const agentsQuery = useAgentNodes(environmentId, apiVersionQuery.data || 1, {
    enabled: isSwarmAgent,
  });

  if (!networksQuery.data) {
    return { isLoading: networksQuery.isLoading };
  }

  const networks = groupSwarmNetworksManagerNodesFirst(
    networksQuery.data,
    agentsQuery.data
  );

  return {
    data: networks,
    isLoading: networksQuery.isLoading,
  };
}

export function groupSwarmNetworksManagerNodesFirst(
  networks: Array<DecoratedNetwork>,
  agents: Array<AgentNode> = []
): Array<DecoratedNetwork> {
  const nonSwarmNetworks = networks.filter((item) => item.Scope !== 'swarm');
  const swarmNetworks = networks.filter((item) => item.Scope === 'swarm');

  const swarmNetworksById = new Map<string, Array<DecoratedNetwork>>();
  swarmNetworks.forEach((item) => {
    const group = swarmNetworksById.get(item.Id) ?? [];
    group.push(item);
    swarmNetworksById.set(item.Id, group);
  });

  const groupedSwarmNetworks = Array.from(swarmNetworksById.values()).map(
    (group) => {
      const [item, ...rest] = _.sortBy(group, getRole);
      return { ...item, Subs: rest };
    }
  );

  return [...groupedSwarmNetworks, ...nonSwarmNetworks];

  function getRole(item: NetworkViewModel) {
    return agents.find((agent) => agent.NodeName === item.NodeName)?.NodeRole;
  }
}
