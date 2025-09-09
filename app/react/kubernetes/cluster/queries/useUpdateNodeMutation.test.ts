import { KubernetesPortainerNodeDrainLabel } from '../nodeUtils';
import { NodeFormValues } from '../NodeView/NodeDetails/types';

import { buildSpec, buildLabels } from './useUpdateNodeMutation';

// Test helper to create form values
function createTestFormValues(
  overrides: Partial<NodeFormValues> = {}
): NodeFormValues {
  return {
    availability: 'Active',
    labels: [],
    taints: [],
    ...overrides,
  };
}

describe('Node availability states', () => {
  it('should handle all availability transitions correctly', () => {
    const activeResult = buildSpec(
      createTestFormValues({ availability: 'Active' })
    );
    const pauseResult = buildSpec(
      createTestFormValues({ availability: 'Pause' })
    );
    const drainResult = buildSpec(
      createTestFormValues({ availability: 'Drain' })
    );

    expect(activeResult.unschedulable).toBeUndefined();
    expect(pauseResult.unschedulable).toBe(true);
    expect(drainResult.unschedulable).toBe(true);
  });

  it('should add drain label only for Drain availability', () => {
    const originalLabels = { 'kubernetes.io/hostname': 'test-node' };

    const drainResult = buildLabels(
      createTestFormValues({ availability: 'Drain' }),
      originalLabels
    );
    const pauseResult = buildLabels(
      createTestFormValues({ availability: 'Pause' }),
      originalLabels
    );

    expect(drainResult[KubernetesPortainerNodeDrainLabel]).toBe('');
    expect(pauseResult[KubernetesPortainerNodeDrainLabel]).toBeUndefined();
  });
});

describe('Taint management', () => {
  it('should filter out taints marked for deletion', () => {
    const formValues = createTestFormValues({
      taints: [
        {
          key: 'keep-taint',
          value: 'value',
          effect: 'NoSchedule',
          isNew: false,
          isChanged: false,
        },
        {
          key: 'delete-taint',
          value: 'value',
          effect: 'NoExecute',
          isNew: false,
          isChanged: false,
          needsDeletion: true,
        },
      ],
    });
    const result = buildSpec(formValues);

    expect(result.taints).toHaveLength(1);
    expect(result.taints?.[0].key).toBe('keep-taint');
  });
});

describe('Label management', () => {
  const originalLabels = {
    'kubernetes.io/hostname': 'test-node',
    'node-role.kubernetes.io/control-plane': '',
    'beta.kubernetes.io/arch': 'amd64',
    'node.kubernetes.io/microk8s-controlplane': 'microk8s-controlplane',
    'user-label': 'old-value',
  };

  it('should preserve all system label types and filter user labels', () => {
    const formValues = createTestFormValues({
      labels: [
        {
          key: 'new-user-label',
          value: 'new-value',
          isNew: true,
          isChanged: false,
          isSystem: false,
        },
        {
          key: 'delete-label',
          value: 'delete-value',
          isNew: false,
          isChanged: false,
          isSystem: false,
          needsDeletion: true,
        },
      ],
    });
    const result = buildLabels(formValues, originalLabels);

    expect(result['kubernetes.io/hostname']).toBe('test-node');
    expect(result['node-role.kubernetes.io/control-plane']).toBe('');
    expect(result['beta.kubernetes.io/arch']).toBe('amd64');
    expect(result['node.kubernetes.io/microk8s-controlplane']).toBe(
      'microk8s-controlplane'
    );

    expect(result['new-user-label']).toBe('new-value');
    expect(result['delete-label']).toBeUndefined();
    expect(result['user-label']).toBeUndefined();
  });

  it('should handle empty values and missing keys', () => {
    const formValues = createTestFormValues({
      labels: [
        {
          key: 'empty-value-label',
          value: '',
          isNew: true,
          isChanged: false,
          isSystem: false,
        },
        {
          key: '',
          value: 'some-value',
          isNew: true,
          isChanged: false,
          isSystem: false,
        },
      ],
    });
    const result = buildLabels(formValues, {});

    expect(result['empty-value-label']).toBe('');
    expect(Object.keys(result)).not.toContain('');
  });

  it('should handle completely empty node state', () => {
    const formValues = createTestFormValues();
    const specResult = buildSpec(formValues);
    const labelsResult = buildLabels(formValues, {});

    expect(specResult.unschedulable).toBeUndefined();
    expect(specResult.taints).toBeUndefined();
    expect(Object.keys(labelsResult)).toHaveLength(0);
  });
});
