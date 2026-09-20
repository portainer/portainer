import { Node, Endpoints } from 'kubernetes-types/core/v1';
import { HardDrive } from 'lucide-react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { IndexOptional } from '@/react/kubernetes/configs/types';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { hiddenColumnsSettings } from '@@/datatables/types';
import { getColumnVisibilityState } from '@@/datatables/ColumnVisibilityMenu';

import { useKubernetesEndpointsQuery } from '../../kubernetesEndpoint.service';
import { useNodesQuery } from '../../queries/useNodesQuery';
import {
  getInstanceType,
  getNodeApiDetails,
  getNodeGroup,
  isNodePublished,
} from '../../nodeUtils';

import { getColumns } from './columns';
import { NodeRowData, NodesTableSettings } from './types';
import { TableSettings } from './TableSettings';

const storageKey = 'k8sNodesDatatable';
// Only the node group is shown by default. Instance type, labels and taints are
// opted into from the show/hide columns menu: together they push the table past
// the width of a laptop screen, and a node's pool is the one operators asked to
// see at a glance.
const defaultHiddenColumns = ['instanceType', 'labels', 'taints'];
const settingsStore = createStore<NodesTableSettings>(
  storageKey,
  undefined,
  (set) => hiddenColumnsSettings(set, defaultHiddenColumns)
);

export function NodesDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const environmentId = useEnvironmentId();
  const { data: nodes, ...nodesQuery } = useNodesQuery(environmentId, {
    autoRefreshRate: tableState.autoRefreshRateMS,
  });
  const { data: kubernetesEndpoints, ...kubernetesEndpointsQuery } =
    useKubernetesEndpointsQuery(environmentId, {
      autoRefreshRate: tableState.autoRefreshRateMS,
    });
  const { data: environment, ...environmentQuery } =
    useEnvironment(environmentId);
  const environmentUrl = environment?.URL;
  const isServerMetricsEnabled =
    !!environment?.Kubernetes?.Configuration.UseServerMetrics;
  const nodeRowData = useNodeRowData(
    nodes,
    kubernetesEndpoints,
    environmentUrl
  );

  return (
    <Datatable<IndexOptional<NodeRowData>>
      disableSelect
      dataset={nodeRowData ?? []}
      columns={getColumns({
        isServerMetricsEnabled,
        hasNodeGroups: nodeRowData.some((node) => getNodeGroup(node)),
        hasInstanceTypes: nodeRowData.some((node) => getInstanceType(node)),
      })}
      settingsManager={tableState}
      isLoading={
        nodesQuery.isLoading ||
        kubernetesEndpointsQuery.isLoading ||
        environmentQuery.isLoading
      }
      title="Nodes"
      titleIcon={HardDrive}
      getRowId={(row) => row.metadata?.uid ?? ''}
      initialTableState={getColumnVisibilityState(tableState.hiddenColumns)}
      renderTableSettings={(table) => (
        <TableSettings settings={tableState} table={table} />
      )}
      data-cy="k8s-nodes-datatable"
    />
  );
}

/**
 * This function is used to add the isApi property to the node row data.
 */
function useNodeRowData(
  nodes?: Node[],
  kubernetesEndpoints?: Endpoints[],
  environmentUrl?: string
): NodeRowData[] {
  return useMemo<NodeRowData[]>(() => {
    if (!nodes || !kubernetesEndpoints) {
      return [];
    }
    const nodeRowData = nodes.map((node) => {
      // if the node address is in the endpoints subset addresses, then it is an api node
      const { isApi } = getNodeApiDetails(node, kubernetesEndpoints);
      const isPublishedNode = isNodePublished(node, environmentUrl);
      return {
        ...node,
        isApi,
        isPublishedNode,
        Name: `${node.metadata?.name}${isApi ? 'api' : ''}`,
      };
    });
    return nodeRowData;
  }, [nodes, kubernetesEndpoints, environmentUrl]);
}
