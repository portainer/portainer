import { Layers } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';

import { useEdgeStacks } from '../../queries/useEdgeStacks';
import { EdgeStack } from '../../types';

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
  const aggregateStatus = { ok: 0, error: 0, acknowledged: 0, imagesPulled: 0 };
  return Object.values(stackStatus).reduce((acc, envStatus) => {
    acc.ok += Number(envStatus.Details.Ok);
    acc.error += Number(envStatus.Details.Error);
    acc.acknowledged += Number(envStatus.Details.Acknowledged);
    acc.imagesPulled += Number(envStatus.Details.ImagesPulled);
    return acc;
  }, aggregateStatus);
}
