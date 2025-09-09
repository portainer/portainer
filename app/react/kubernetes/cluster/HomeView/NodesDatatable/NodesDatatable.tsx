import { Node, Endpoints } from 'kubernetes-types/core/v1';
import { HardDrive } from 'lucide-react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { IndexOptional } from '@/react/kubernetes/configs/types';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { useKubernetesEndpointsQuery } from '../../kubernetesEndpoint.service';
import { useNodesQuery } from '../../queries/useNodesQuery';
import { getNodeApiDetails, isNodePublished } from '../../nodeUtils';

import { getColumns } from './columns';
import { NodeRowData } from './types';

const storageKey = 'k8sNodesDatatable';
const settingsStore = createStore(storageKey);

export function NodesDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const environmentId = useEnvironmentId();
  const { data: nodes, ...nodesQuery } = useNodesQuery(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const { data: kubernetesEndpoints, ...kubernetesEndpointsQuery } =
    useKubernetesEndpointsQuery(environmentId, {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
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
      columns={getColumns(isServerMetricsEnabled)}
      settingsManager={tableState}
      isLoading={
        nodesQuery.isLoading ||
        kubernetesEndpointsQuery.isLoading ||
        environmentQuery.isLoading
      }
      title="Nodes"
      titleIcon={HardDrive}
      getRowId={(row) => row.metadata?.uid ?? ''}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
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
