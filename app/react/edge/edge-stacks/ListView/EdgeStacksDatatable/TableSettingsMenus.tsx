import { Table } from '@tanstack/react-table';

import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { DecoratedEdgeStack } from './types';
import { TableSettings } from './store';

export function TableSettingsMenus({
  tableInstance,
  tableState,
}: {
  tableInstance: Table<DecoratedEdgeStack>;
  tableState: TableSettings;
}) {
  return (
    <>
      <ColumnVisibilityMenu<DecoratedEdgeStack>
        table={tableInstance}
        onChange={(hiddenColumns) => {
          tableState.setHiddenColumns(hiddenColumns);
        }}
        value={tableState.hiddenColumns}
      />
      <TableSettingsMenu>
        <TableSettingsMenuAutoRefresh
          value={tableState.autoRefreshRate}
          onChange={(value) => tableState.setAutoRefreshRate(value)}
        />
      </TableSettingsMenu>
    </>
  );
}
