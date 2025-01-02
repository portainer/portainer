import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';
import { Pod, Taint, Node } from 'kubernetes-types/core/v1';
import _ from 'lodash';

import { useNodesQuery } from '@/react/kubernetes/cluster/HomeView/nodes.service';
import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from '@/kubernetes/pod/models';

import {
  BasicTableSettings,
  RefreshableTableSettings,
  createPersistedStore,
  refreshableSettings,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { Affinity, Label, NodePlacementRowData } from '../types';
import { useApplication } from '../../queries/useApplication';
import { useApplicationPods } from '../../queries/useApplicationPods';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'node', (set) => ({
    ...refreshableSettings(set),
  }));
}

const storageKey = 'kubernetes.application.placements';
const placementsSettingsStore = createStore(storageKey);

export function usePlacementTableState() {
  return useTableState(placementsSettingsStore, storageKey);
}

export function usePlacementTableData() {
  const placementsTableState = usePlacementTableState();
  const autoRefreshRate = placementsTableState.autoRefreshRate * 1000; // ms to seconds

  const stateAndParams = useCurrentStateAndParams();
  const {
    params: {
      namespace,
      name,
      'resource-type': resourceType,
      endpointId: environmentId,
    },
  } = stateAndParams;
  const { data: application, ...applicationQuery } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType,
    { autoRefreshRate }
  );
  const { data: pods, ...podsQuery } = useApplicationPods(
    environmentId,
    namespace,
    name,
    application,
    { autoRefreshRate }
  );
  const { data: nodes, ...nodesQuery } = useNodesQuery(environmentId, {
    autoRefreshRate,
  });

  const placementsData = useMemo(
    () => (nodes && pods ? computePlacements(nodes, pods) : []),
    [nodes, pods]
  );

  const isPlacementsTableLoading =
    applicationQuery.isLoading || nodesQuery.isLoading || podsQuery.isLoading;

  const hasPlacementWarning = useMemo(() => {
    const notAllowedOnEveryNode = placementsData.every(
      (nodePlacement) => !nodePlacement.acceptsApplication
    );
    return !isPlacementsTableLoading && notAllowedOnEveryNode;
  }, [isPlacementsTableLoading, placementsData]);

  return {
    placementsData,
    isPlacementsTableLoading,
    hasPlacementWarning,
  };
}

export function computePlacements(
  nodes: Node[],
  pods: Pod[]
): NodePlacementRowData[] {
  const pod = pods?.[0];
  if (!pod) {
    return [];
  }

  const placementDataFromTolerations: NodePlacementRowData[] =
    computeTolerations(nodes, pod);
  const placementDataFromAffinities: NodePlacementRowData[] = computeAffinities(
    nodes,
    placementDataFromTolerations,
    pod
  );
  return placementDataFromAffinities;
}

function computeTolerations(nodes: Node[], pod: Pod): NodePlacementRowData[] {
  const tolerations = pod.spec?.tolerations || [];
  const nodePlacements: NodePlacementRowData[] = nodes.map((node) => {
    let acceptsApplication = true;
    const unmetTaints: Taint[] = [];
    const taints = node.spec?.taints || [];
    taints.forEach((taint) => {
      const matchKeyMatchValueMatchEffect = _.find(tolerations, {
        key: taint.key,
        operator: 'Equal',
        value: taint.value,
        effect: taint.effect,
      });
      const matchKeyAnyValueMatchEffect = _.find(tolerations, {
        key: taint.key,
        operator: 'Exists',
        effect: taint.effect,
      });
      const matchKeyMatchValueAnyEffect = _.find(tolerations, {
        key: taint.key,
        operator: 'Equal',
        value: taint.value,
        effect: '',
      });
      const matchKeyAnyValueAnyEffect = _.find(tolerations, {
        key: taint.key,
        operator: 'Exists',
        effect: '',
      });
      const anyKeyAnyValueAnyEffect = _.find(tolerations, {
        key: '',
        operator: 'Exists',
        effect: '',
      });
      if (
        !matchKeyMatchValueMatchEffect &&
        !matchKeyAnyValueMatchEffect &&
        !matchKeyMatchValueAnyEffect &&
        !matchKeyAnyValueAnyEffect &&
        !anyKeyAnyValueAnyEffect
      ) {
        acceptsApplication = false;
        unmetTaints?.push(taint);
      } else {
        acceptsApplication = true;
      }
    });
    return {
      name: node.metadata?.name || '',
      acceptsApplication,
      unmetTaints,
      highlighted: false,
    };
  });

  return nodePlacements;
}

function getUnmatchedNodeSelectorLabels(node: Node, pod: Pod): Label[] {
  const nodeLabels = node.metadata?.labels || {};
  const podNodeSelectorLabels = pod.spec?.nodeSelector || {};

  return Object.entries(podNodeSelectorLabels)
    .filter(([key, value]) => nodeLabels[key] !== value)
    .map(([key, value]) => ({
      key,
      value,
    }));
}

// Function to get unmatched required node affinities
function getUnmatchedRequiredNodeAffinities(node: Node, pod: Pod): Affinity[] {
  const basicNodeAffinity =
    pod.spec?.affinity?.nodeAffinity
      ?.requiredDuringSchedulingIgnoredDuringExecution;

  const unmatchedRequiredNodeAffinities: Affinity[] =
    basicNodeAffinity?.nodeSelectorTerms
      .map(
        (selectorTerm) =>
          selectorTerm.matchExpressions?.flatMap((matchExpression) => {
            const exists = !!node.metadata?.labels?.[matchExpression.key];
            const isIn =
              exists &&
              _.includes(
                matchExpression.values,
                node.metadata?.labels?.[matchExpression.key]
              );

            // Check if the match expression is satisfied
            if (
              (matchExpression.operator === 'Exists' && exists) ||
              (matchExpression.operator === 'DoesNotExist' && !exists) ||
              (matchExpression.operator === 'In' && isIn) ||
              (matchExpression.operator === 'NotIn' && !isIn) ||
              (matchExpression.operator === 'Gt' &&
                exists &&
                parseInt(
                  node.metadata?.labels?.[matchExpression.key] || '',
                  10
                ) > parseInt(matchExpression.values?.[0] || '', 10)) ||
              (matchExpression.operator === 'Lt' &&
                exists &&
                parseInt(
                  node.metadata?.labels?.[matchExpression.key] || '',
                  10
                ) < parseInt(matchExpression.values?.[0] || '', 10))
            ) {
              return [];
            }

            // Return the unmatched affinity
            return [
              {
                key: matchExpression.key,
                operator:
                  matchExpression.operator as KubernetesPodNodeAffinityNodeSelectorRequirementOperators,
                values: matchExpression.values?.join(', ') || '',
              },
            ];
          }) || []
      )
      .filter((unmatchedAffinity) => unmatchedAffinity.length > 0) || [];
  return unmatchedRequiredNodeAffinities;
}

// Node requirement depending on the operator value
// https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity
function computeAffinities(
  nodes: Node[],
  nodePlacements: NodePlacementRowData[],
  pod: Pod
): NodePlacementRowData[] {
  const nodePlacementsFromAffinities: NodePlacementRowData[] = nodes.map(
    (node, nodeIndex) => {
      let { acceptsApplication } = nodePlacements[nodeIndex];

      // check node selectors for unmatched labels
      const unmatchedNodeSelectorLabels = getUnmatchedNodeSelectorLabels(
        node,
        pod
      );

      // check node affinities that are required during scheduling
      const unmatchedRequiredNodeAffinities =
        getUnmatchedRequiredNodeAffinities(node, pod);

      // If there are any unmatched affinities or node labels, the node does not accept the application
      if (
        unmatchedRequiredNodeAffinities.length ||
        unmatchedNodeSelectorLabels.length
      ) {
        acceptsApplication = false;
      }

      const nodePlacementRowData: NodePlacementRowData = {
        ...nodePlacements[nodeIndex],
        acceptsApplication,
        unmatchedNodeSelectorLabels,
        unmatchedNodeAffinities: unmatchedRequiredNodeAffinities,
      };

      return nodePlacementRowData;
    }
  );
  return nodePlacementsFromAffinities;
}
