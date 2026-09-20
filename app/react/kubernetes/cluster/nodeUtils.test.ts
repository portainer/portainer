import { Node } from 'kubernetes-types/core/v1';

import {
  getInstanceType,
  getNodeGroup,
  getNodeLabelStrings,
  getNodeTaintStrings,
} from './nodeUtils';

function createNodeWithMetadata(node: Partial<Node> = {}): Node {
  return {
    metadata: { name: 'node-1' },
    ...node,
  };
}

describe('getNodeGroup', () => {
  it.each([
    ['eks.amazonaws.com/nodegroup', 'gpu-workers'],
    ['cloud.google.com/gke-nodepool', 'pool-1'],
    ['kubernetes.azure.com/agentpool', 'agentpool-a'],
    ['agentpool', 'agentpool-a'],
    ['kops.k8s.io/instancegroup', 'nodes-us-east-1a'],
  ])('reads the node group from %s', (labelKey, value) => {
    const node = createNodeWithMetadata({
      metadata: { labels: { [labelKey]: value } },
    });

    expect(getNodeGroup(node)).toBe(value);
  });

  it('prefers the Karpenter pool when a node also carries an EKS node group', () => {
    const node = createNodeWithMetadata({
      metadata: {
        labels: {
          'eks.amazonaws.com/nodegroup': 'managed-workers',
          'karpenter.sh/nodepool': 'spot-pool',
        },
      },
    });

    expect(getNodeGroup(node)).toBe('spot-pool');
  });

  it('returns undefined when no node group label is set', () => {
    expect(getNodeGroup(createNodeWithMetadata())).toBeUndefined();
  });
});

describe('getInstanceType', () => {
  it('reads the well-known instance type label', () => {
    const node = createNodeWithMetadata({
      metadata: { labels: { 'node.kubernetes.io/instance-type': 'm5.large' } },
    });

    expect(getInstanceType(node)).toBe('m5.large');
  });

  it('falls back to the deprecated beta label', () => {
    const node = createNodeWithMetadata({
      metadata: { labels: { 'beta.kubernetes.io/instance-type': 'm4.large' } },
    });

    expect(getInstanceType(node)).toBe('m4.large');
  });

  it('returns undefined when the node has no instance type', () => {
    expect(getInstanceType(createNodeWithMetadata())).toBeUndefined();
  });
});

describe('getNodeLabelStrings', () => {
  it('formats labels as sorted key=value pairs', () => {
    const node = createNodeWithMetadata({
      metadata: {
        labels: {
          'topology.kubernetes.io/zone': 'us-east-1a',
          'eks.amazonaws.com/nodegroup': 'gpu-workers',
        },
      },
    });

    expect(getNodeLabelStrings(node)).toEqual([
      'eks.amazonaws.com/nodegroup=gpu-workers',
      'topology.kubernetes.io/zone=us-east-1a',
    ]);
  });

  it('keeps the separator for labels with an empty value, as kubectl does', () => {
    const node = createNodeWithMetadata({
      metadata: { labels: { 'node-role.kubernetes.io/control-plane': '' } },
    });

    expect(getNodeLabelStrings(node)).toEqual([
      'node-role.kubernetes.io/control-plane=',
    ]);
  });

  it('sorts by key, so a node group is not pushed below its -image sibling', () => {
    // Both of these are set on every EKS managed node. Sorting the formatted
    // `key=value` strings would order the image first, because `-` < `=`.
    const node = createNodeWithMetadata({
      metadata: {
        labels: {
          'eks.amazonaws.com/nodegroup-image': 'ami-0abc123',
          'eks.amazonaws.com/nodegroup': 'general-workers',
        },
      },
    });

    expect(getNodeLabelStrings(node)).toEqual([
      'eks.amazonaws.com/nodegroup=general-workers',
      'eks.amazonaws.com/nodegroup-image=ami-0abc123',
    ]);
  });

  it('returns an empty array when the node has no labels', () => {
    expect(getNodeLabelStrings(createNodeWithMetadata())).toEqual([]);
  });
});

describe('getNodeTaintStrings', () => {
  it('formats taints as key=value:Effect', () => {
    const node = createNodeWithMetadata({
      spec: {
        taints: [{ key: 'dedicated', value: 'gpu', effect: 'NoSchedule' }],
      },
    });

    expect(getNodeTaintStrings(node)).toEqual(['dedicated=gpu:NoSchedule']);
  });

  it('omits the value when the taint has none', () => {
    const node = createNodeWithMetadata({
      spec: {
        taints: [
          {
            key: 'node-role.kubernetes.io/control-plane',
            effect: 'NoSchedule',
          },
        ],
      },
    });

    expect(getNodeTaintStrings(node)).toEqual([
      'node-role.kubernetes.io/control-plane:NoSchedule',
    ]);
  });

  it('returns an empty array when the node has no taints', () => {
    expect(getNodeTaintStrings(createNodeWithMetadata())).toEqual([]);
  });
});
