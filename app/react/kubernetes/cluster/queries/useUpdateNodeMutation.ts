import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Operation, compare } from 'fast-json-patch';
import { Node } from 'kubernetes-types/core/v1';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';
import { isSystemLabel, KubernetesPortainerNodeDrainLabel } from '../nodeUtils';
import { NodeFormValues } from '../NodeView/NodeDetails/types';

import { queryKeys } from './query-keys';

export function useUpdateNodeMutation(
  environmentId: EnvironmentId,
  nodeName: string
) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ formValues, node }: { formValues: NodeFormValues; node: Node }) =>
      updateNode(environmentId, nodeName, formValues, node),
    {
      ...withInvalidate(queryClient, [
        queryKeys.nodes(environmentId),
        queryKeys.node(environmentId, nodeName),
      ]),
      ...withGlobalError('Unable to update node'),
    }
  );
}

async function updateNode(
  environmentId: EnvironmentId,
  nodeName: string,
  formValues: NodeFormValues,
  originalNode: Node
) {
  try {
    const patch = createNodePatch(formValues, originalNode);
    const { data } = await axios.patch<Node>(
      `/endpoints/${environmentId}/kubernetes/api/v1/nodes/${nodeName}`,
      patch,
      {
        headers: {
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to update node');
  }
}

function createNodePatch(
  formValues: NodeFormValues,
  originalNode: Node
): Operation[] {
  const newNode = formValuesToNode(formValues, originalNode);
  const oldPayload = createNodePatchPayload(originalNode);
  const newPayload = createNodePatchPayload(newNode);
  return compare(oldPayload, newPayload);
}

function formValuesToNode(
  formValues: NodeFormValues,
  originalNode: Node
): Node {
  const node = structuredClone(originalNode);
  const newSpec = buildSpec(formValues);

  return {
    ...node,
    metadata: {
      ...node.metadata,
      labels: buildLabels(formValues, node.metadata?.labels || {}),
    },
    spec: {
      ...node.spec,
      ...newSpec,
      // Only use the taints from the newSpec, not the original node
      taints: newSpec.taints,
      // Explicitly handle unschedulable for Active state
      ...(formValues.availability === 'Active' && { unschedulable: undefined }),
    },
  };
}

export function buildSpec(formValues: NodeFormValues) {
  const spec: {
    unschedulable?: boolean;
    taints?: Array<{ key: string; value: string; effect: string }>;
  } = {};

  if (formValues.availability !== 'Active') {
    spec.unschedulable = true;
  }

  const filteredTaints = formValues.taints.filter(
    (taint) => !taint.needsDeletion
  );

  if (filteredTaints.length > 0) {
    spec.taints = filteredTaints.map((taint) => ({
      key: taint.key,
      value: taint.value,
      effect: taint.effect,
    }));
  }

  return spec;
}

export function buildLabels(
  formValues: NodeFormValues,
  originalLabels: Record<string, string>
): Record<string, string> {
  const systemLabels = getSystemLabels(originalLabels);
  const drainLabel = getDrainLabel(formValues.availability);
  const userLabels = getUserLabels(formValues.labels);

  return {
    ...systemLabels,
    ...drainLabel,
    ...userLabels,
  };
}

function getSystemLabels(originalLabels: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(originalLabels).filter(([key]) => isSystemLabel(key))
  );
}

function getDrainLabel(availability: string): Record<string, string> {
  return availability === 'Drain'
    ? { [KubernetesPortainerNodeDrainLabel]: '' }
    : {};
}

function getUserLabels(formLabels: NodeFormValues['labels']) {
  return Object.fromEntries(
    formLabels
      .filter(
        (label) =>
          !label.needsDeletion && label.key && !isSystemLabel(label.key)
      )
      .map((label) => [label.key, label.value || ''])
  );
}

function createNodePatchPayload(node: Node) {
  return {
    metadata: {
      name: node.metadata?.name,
      labels: node.metadata?.labels,
    },
    spec: {
      taints: node.spec?.taints,
      unschedulable: node.spec?.unschedulable,
    },
  };
}
