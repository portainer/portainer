import { Table } from '@tanstack/react-table';

import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';

import { NodeRowData, NodesTableSettings } from './types';

export function TableSettings({
  settings,
  table,
}: {
  settings: NodesTableSettings;
  table: Table<NodeRowData>;
}) {
  return (
    <>
      <ColumnVisibilityMenu<NodeRowData>
        table={table}
        onChange={(hiddenColumns) => settings.setHiddenColumns(hiddenColumns)}
        value={settings.hiddenColumns}
      />
      <TableSettingsMenu>
        <TableSettingsMenuAutoRefresh
          value={settings.autoRefreshRateMS}
          onChange={(value) => settings.setAutoRefreshRate(value)}
        />
      </TableSettingsMenu>
    </>
  );
}
