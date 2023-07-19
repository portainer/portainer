import { Layers } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';

import { useEdgeStacks } from '../../queries/useEdgeStacks';
import { EdgeStack, StatusType } from '../../types';

import { createStore } from './store';
import { columns } from './columns';
import { DecoratedEdgeStack } from './types';
import { TableSettingsMenus } from './TableSettingsMenus';
import { TableActions } from './TableActions';

const tableKey = 'edge-stacks';

const settingsStore = createStore(tableKey);

export function EdgeStacksDatatable() {
  const tableState = useTableState(settingsStore, tableKey);
  const edgeStacksQuery = useEdgeStacks<Array<DecoratedEdgeStack>>({
    select: (edgeStacks) =>
      edgeStacks.map((edgeStack) => ({
        ...edgeStack,
        aggregatedStatus: aggregateStackStatus(edgeStack.Status),
      })),
    refetchInterval: tableState.autoRefreshRate * 1000,
  });

  return (
    <Datatable
      title="Edge Stacks"
      titleIcon={Layers}
      columns={columns}
      dataset={edgeStacksQuery.data || []}
      settingsManager={tableState}
      emptyContentLabel="No stack available."
      isLoading={edgeStacksQuery.isLoading}
      renderTableSettings={(tableInstance) => (
        <TableSettingsMenus
          tableInstance={tableInstance}
          tableState={tableState}
        />
      )}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} />
      )}
    />
  );
}

function aggregateStackStatus(stackStatus: EdgeStack['Status']) {
  const aggregateStatus: Partial<Record<StatusType, number>> = {};
  return Object.values(stackStatus).reduce(
    (acc, envStatus) =>
      envStatus.Status.reduce((acc, status) => {
        const { Type } = status;
        acc[Type] = (acc[Type] || 0) + 1;
        return acc;
      }, acc),
    aggregateStatus
  );
}
