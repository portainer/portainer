import { describe, it, expect } from 'vitest';

import { DecoratedNetwork } from '@/react/docker/networks/ListView/types';

import { groupSwarmNetworksManagerNodesFirst } from './groupSwarmNetworks';

function createNetwork(
  overrides: Partial<DecoratedNetwork> = {}
): DecoratedNetwork {
  return {
    Id: 'net1',
    Name: 'network',
    Scope: 'swarm',
    Subs: [],
    ...overrides,
  } as DecoratedNetwork;
}

const agents = [
  { NodeName: 'mgr', NodeRole: 'manager' },
  { NodeName: 'wrk', NodeRole: 'worker' },
];

describe('groupSwarmNetworksManagerNodesFirst', () => {
  it('collapses per-node copies of a swarm network and orders manager first', () => {
    const worker = createNetwork({ Id: 'net1', NodeName: 'wrk' });
    const manager = createNetwork({ Id: 'net1', NodeName: 'mgr' });

    const result = groupSwarmNetworksManagerNodesFirst(
      [worker, manager],
      agents
    );

    expect(result).toHaveLength(1);
    expect(result[0].NodeName).toBe('mgr');
    expect(result[0].Subs).toHaveLength(1);
    expect(result[0].Subs?.[0].NodeName).toBe('wrk');
  });

  // Regression: previously `_.find(...).NodeRole` threw
  // "cannot read properties of undefined (reading 'NodeRole')" when a network's
  // NodeName matched no agent.
  it('does not throw when a network NodeName matches no agent', () => {
    function run() {
      return groupSwarmNetworksManagerNodesFirst(
        [
          createNetwork({ Id: 'net2', NodeName: 'ghost' }),
          createNetwork({ Id: 'net3', NodeName: undefined }),
        ],
        agents
      );
    }

    expect(run).not.toThrow();
    expect(run()).toHaveLength(2);
  });

  it('leaves non-swarm networks untouched and appends them at the end', () => {
    const swarmNet = createNetwork({
      Id: 'net1',
      Scope: 'swarm',
      NodeName: 'mgr',
    });
    const localNet = createNetwork({ Id: 'net2', Scope: 'local' });

    const result = groupSwarmNetworksManagerNodesFirst(
      [swarmNet, localNet],
      agents
    );

    expect(result).toHaveLength(2);
    expect(result[0].Scope).toBe('swarm');
    expect(result[result.length - 1].Scope).toBe('local');
  });

  it('nests every additional node copy under Subs', () => {
    const nets = ['a', 'b', 'c'].map((nodeName) =>
      createNetwork({ Id: 'net1', NodeName: nodeName })
    );

    const result = groupSwarmNetworksManagerNodesFirst(nets, [
      { NodeName: 'a', NodeRole: 'manager' },
      { NodeName: 'b', NodeRole: 'worker' },
      { NodeName: 'c', NodeRole: 'worker' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].Subs).toHaveLength(2);
  });
});
