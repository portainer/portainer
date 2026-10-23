import { describe, it, expect } from 'vitest';

import { AgentNode } from '../../agent/queries/useAgentNodes';

import { groupSwarmNetworksManagerNodesFirst } from './useNetworksData';
import { DecoratedNetwork } from './types';

describe('groupSwarmNetworksManagerNodesFirst', () => {
  it('should leave non-swarm networks untouched and unsubbed', () => {
    const local = createNetwork({ Id: 'net1', Scope: 'local' });

    const result = groupSwarmNetworksManagerNodesFirst([local], []);

    expect(result).toEqual([local]);
  });

  it('should group swarm networks sharing an Id, nesting the rest under Subs', () => {
    const manager = createNetwork({
      Id: 'net1',
      NodeName: 'node-manager',
    });
    const worker = createNetwork({
      Id: 'net1',
      NodeName: 'node-worker',
    });
    const agents = [
      createAgent({ NodeName: 'node-manager', NodeRole: 'manager' }),
      createAgent({ NodeName: 'node-worker', NodeRole: 'worker' }),
    ];

    const [result] = groupSwarmNetworksManagerNodesFirst(
      [worker, manager],
      agents
    );

    expect(result.NodeName).toBe('node-manager');
    expect(result.Subs).toEqual([worker]);
  });

  it('should place networks with no matching agent role after known roles', () => {
    const manager = createNetwork({ Id: 'net1', NodeName: 'node-manager' });
    const unknown = createNetwork({ Id: 'net1', NodeName: 'node-unknown' });
    const agents = [
      createAgent({ NodeName: 'node-manager', NodeRole: 'manager' }),
    ];

    const [result] = groupSwarmNetworksManagerNodesFirst(
      [unknown, manager],
      agents
    );

    expect(result.NodeName).toBe('node-manager');
    expect(result.Subs).toEqual([unknown]);
  });

  it('should put grouped swarm networks before non-swarm networks', () => {
    const swarm = createNetwork({ Id: 'net1', Scope: 'swarm' });
    const local = createNetwork({ Id: 'net2', Scope: 'local' });

    const result = groupSwarmNetworksManagerNodesFirst([local, swarm], []);

    expect(result.map((n) => n.Id)).toEqual(['net1', 'net2']);
  });

  it('should not mutate the input networks', () => {
    const manager = createNetwork({ Id: 'net1', NodeName: 'node-manager' });
    const worker = createNetwork({ Id: 'net1', NodeName: 'node-worker' });
    const agents = [
      createAgent({ NodeName: 'node-manager', NodeRole: 'manager' }),
      createAgent({ NodeName: 'node-worker', NodeRole: 'worker' }),
    ];

    groupSwarmNetworksManagerNodesFirst([worker, manager], agents);

    expect(manager.Subs).toEqual([]);
    expect(worker.Subs).toEqual([]);
  });
});

function createNetwork(
  overrides: Partial<DecoratedNetwork> = {}
): DecoratedNetwork {
  return {
    Id: 'network1',
    Name: 'test-network',
    Scope: 'swarm',
    Driver: 'overlay',
    Attachable: false,
    Internal: false,
    Ingress: false,
    Labels: {},
    IPAM: {},
    Subs: [],
    ...overrides,
  } as DecoratedNetwork;
}

function createAgent(overrides: Partial<AgentNode> = {}): AgentNode {
  return {
    IPAddress: '10.0.0.1',
    NodeName: 'node1',
    NodeRole: 'worker',
    ...overrides,
  };
}
