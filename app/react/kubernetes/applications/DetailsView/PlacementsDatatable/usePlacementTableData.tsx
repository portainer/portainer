import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';
import { Pod, Taint, Node } from 'kubernetes-types/core/v1';
import _ from 'lodash';
import * as JsonPatch from 'fast-json-patch';

import { useNodesQuery } from '@/react/kubernetes/cluster/HomeView/nodes.service';

import {
  BasicTableSettings,
  RefreshableTableSettings,
  createPersistedStore,
  refreshableSettings,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useApplication, useApplicationPods } from '../../application.queries';
import { NodePlacementRowData } from '../types';

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

      if (pod.spec?.nodeSelector) {
        const patch = JsonPatch.compare(
          node.metadata?.labels || {},
          pod.spec.nodeSelector
        );
        _.remove(patch, { op: 'remove' });
        const unmatchedNodeSelectorLabels = patch.map((operation) => ({
          key: _.trimStart(operation.path, '/'),
          value: operation.op,
        }));
        if (unmatchedNodeSelectorLabels.length) {
          acceptsApplication = false;
        }
      }

      const basicNodeAffinity =
        pod.spec?.affinity?.nodeAffinity
          ?.requiredDuringSchedulingIgnoredDuringExecution;
      if (basicNodeAffinity) {
        const unmatchedTerms = basicNodeAffinity.nodeSelectorTerms.map(
          (selectorTerm) => {
            const unmatchedExpressions = selectorTerm.matchExpressions?.flatMap(
              (matchExpression) => {
                const exists = {}.hasOwnProperty.call(
                  node.metadata?.labels,
                  matchExpression.key
                );
                const isIn =
                  exists &&
                  _.includes(
                    matchExpression.values,
                    node.metadata?.labels?.[matchExpression.key]
                  );
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
                return [true];
              }
            );

            return unmatchedExpressions;
          }
        );

        _.remove(unmatchedTerms, (i) => i?.length === 0);
        if (unmatchedTerms.length) {
          acceptsApplication = false;
        }
      }
      return {
        ...nodePlacements[nodeIndex],
        acceptsApplication,
      };
    }
  );
  return nodePlacementsFromAffinities;
}
