import { Layers } from 'lucide-react';
import { Row } from '@tanstack/react-table';

import { useAuthorizations, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Datatable } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { defaultGlobalFilterFn } from '@@/datatables/Datatable';
import { withGlobalFilter } from '@@/datatables/extend-options/withGlobalFilter';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import { isExternalStack, isOrphanedStack } from '../../view-models/utils';

import { TableActions } from './TableActions';
import { TableSettingsMenus } from './TableSettingsMenus';
import { useStore } from './store';
import { useColumns } from './columns';
import { DecoratedStack } from './types';

export function StacksDatatable({
  onRemove,
  onReload,
  isImageNotificationEnabled,
  dataset,
}: {
  onRemove: (items: Array<DecoratedStack>) => void;
  onReload: () => void;
  isImageNotificationEnabled: boolean;
  dataset: Array<DecoratedStack>;
}) {
  const tableState = useStore();
  useRepeater(tableState.autoRefreshRate, onReload);
  const isAdminQuery = useIsEdgeAdmin();
  const { authorized: canManageStacks } = useAuthorizations([
    'PortainerStackCreate',
    'PortainerStackDelete',
  ]);
  const columns = useColumns(isImageNotificationEnabled);

  return (
    <Datatable<DecoratedStack>
      settingsManager={tableState}
      title="Stacks"
      titleIcon={Layers}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} onRemove={onRemove} />
      )}
      renderTableSettings={(tableInstance) => (
        <TableSettingsMenus
          tableInstance={tableInstance}
          tableState={tableState}
        />
      )}
      columns={columns}
      dataset={dataset}
      isRowSelectable={({ original: item }) =>
        allowSelection(item, isAdminQuery.isAdmin, canManageStacks)
      }
      getRowId={(item) => item.Id.toString()}
      initialTableState={{
        globalFilter: {
          showOrphanedStacks: tableState.showOrphanedStacks,
        },
        columnVisibility: Object.fromEntries(
          tableState.hiddenColumns.map((col) => [col, false])
        ),
      }}
      extendTableOptions={mergeOptions(
        withGlobalFilter(globalFilterFn),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      data-cy="docker-stacks-datatable"
    />
  );
}

function allowSelection(
  item: DecoratedStack,
  isAdmin: boolean,
  canManageStacks: boolean
) {
  if (isExternalStack(item)) {
    return false;
  }

  if (isBE && isOrphanedStack(item) && !isAdmin) {
    return false;
  }

  return isAdmin || canManageStacks;
}

function globalFilterFn(
  row: Row<DecoratedStack>,
  columnId: string,
  filterValue: null | { showOrphanedStacks: boolean; search: string }
) {
  return (
    orphanedFilter(row, filterValue) &&
    defaultGlobalFilterFn(row, columnId, filterValue)
  );
}

function orphanedFilter(
  row: Row<DecoratedStack>,
  filterValue: null | { showOrphanedStacks: boolean; search: string }
) {
  if (filterValue?.showOrphanedStacks) {
    return true;
  }

  return !isOrphanedStack(row.original);
}
