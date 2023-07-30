import { Table } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { Checkbox } from '@@/form-components/Checkbox';

import { TableSettings } from './store';
import { DecoratedStack } from './types';

export function TableSettingsMenus({
  tableInstance,
  tableState,
}: {
  tableInstance: Table<DecoratedStack>;
  tableState: TableSettings;
}) {
  const columnsToHide = tableInstance
    .getAllColumns()
    .filter((col) => col.getCanHide());

  return (
    <>
      <ColumnVisibilityMenu<DecoratedStack>
        columns={columnsToHide}
        onChange={(hiddenColumns) => {
          tableState.setHiddenColumns(hiddenColumns);
          tableInstance.setColumnVisibility(
            Object.fromEntries(hiddenColumns.map((col) => [col, false]))
          );
        }}
        value={tableState.hiddenColumns}
      />
      <TableSettingsMenu>
        {isBE && (
          <Authorized authorizations="EndpointResourcesAccess">
            <Checkbox
              id="setting_all_orphaned_stacks"
              label="Show all orphaned stacks"
              checked={tableState.showOrphanedStacks}
              onChange={(e) => {
                tableState.setShowOrphanedStacks(e.target.checked);
                tableInstance.setGlobalFilter((filter: object) => ({
                  ...filter,
                  showOrphanedStacks: e.target.checked,
                }));
              }}
            />
          </Authorized>
        )}
        <TableSettingsMenuAutoRefresh
          value={tableState.autoRefreshRate}
          onChange={(value) => tableState.setAutoRefreshRate(value)}
        />
      </TableSettingsMenu>
    </>
  );
}
