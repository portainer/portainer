import _ from 'lodash';

import { DecoratedNetwork } from '@/react/docker/networks/ListView/types';

interface AgentNode {
  NodeName?: string;
  NodeRole?: string;
}

// groupSwarmNetworksManagerNodesFirst collapses the per-node copies of each
// swarm-scoped network (the agent returns one copy per node, each tagged with a
// NodeName) into a single entry, ordering the copies by node role so manager
// nodes come first. Networks whose NodeName matches no agent sort with an
// undefined role rather than throwing.
export function groupSwarmNetworksManagerNodesFirst(
  networks: DecoratedNetwork[],
  agents: AgentNode[]
): DecoratedNetwork[] {
  function getRole(item: DecoratedNetwork) {
    return _.find(agents, (agent) => agent.NodeName === item.NodeName)
      ?.NodeRole;
  }

  const nonSwarmNetworks = _.remove(networks, (item) => item.Scope !== 'swarm');
  const grouped = _.toArray(_.groupBy(networks, (item) => item.Id));
  const sorted = _.map(grouped, (arr) =>
    _.sortBy(arr, (item) => getRole(item))
  );
  const arr = _.map(sorted, (a) => {
    const item = a[0];
    for (let i = 1; i < a.length; i++) {
      (item.Subs ??= []).push(a[i]);
    }
    return item;
  });

  return _.concat(arr, ...nonSwarmNetworks);
}
