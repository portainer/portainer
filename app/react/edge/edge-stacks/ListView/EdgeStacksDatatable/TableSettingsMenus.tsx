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
  const columnsToHide = tableInstance
    .getAllColumns()
    .filter((col) => col.getCanHide());

  return (
    <>
      {columnsToHide && columnsToHide.length > 0 && (
        <ColumnVisibilityMenu<DecoratedEdgeStack>
          columns={columnsToHide}
          onChange={(hiddenColumns) => {
            tableState.setHiddenColumns(hiddenColumns);
            tableInstance.setColumnVisibility(
              Object.fromEntries(hiddenColumns.map((col) => [col, false]))
            );
          }}
          value={tableState.hiddenColumns}
        />
      )}
      <TableSettingsMenu>
        <TableSettingsMenuAutoRefresh
          value={tableState.autoRefreshRate}
          onChange={(value) => tableState.setAutoRefreshRate(value)}
        />
      </TableSettingsMenu>
    </>
  );
}
