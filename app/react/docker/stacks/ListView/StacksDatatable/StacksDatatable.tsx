import { Layers } from 'lucide-react';
import { Row, TableMeta } from '@tanstack/react-table';

import { useAuthorizations, useCurrentUser } from '@/react/hooks/useUser';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { useRepeater } from '@@/datatables/useRepeater';
import { defaultGlobalFilterFn } from '@@/datatables/Datatable';

import { isExternalStack, isOrphanedStack } from '../../view-models/utils';

import { TableActions } from './TableActions';
import { TableSettingsMenus } from './TableSettingsMenus';
import { createStore } from './store';
import { useColumns } from './columns';
import { DecoratedStack } from './types';

const tableKey = 'docker_stacks';
const settingsStore = createStore(tableKey);

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
  const tableState = useTableState(settingsStore, tableKey);
  useRepeater(tableState.autoRefreshRate, onReload);
  const { isAdmin } = useCurrentUser();
  const canManageStacks = useAuthorizations([
    'PortainerStackCreate',
    'PortainerStackDelete',
  ]);
  const columns = useColumns(isImageNotificationEnabled);

  return (
    <Datatable<
      DecoratedStack,
      TableMeta<DecoratedStack>,
      { search: string; showOrphanedStacks: boolean }
    >
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
        allowSelection(item, isAdmin, canManageStacks)
      }
      getRowId={(item) => item.Id.toString()}
      globalFilterFn={globalFilterFn}
      initialTableState={{
        globalFilter: {
          showOrphanedStacks: tableState.showOrphanedStacks,
        },
        columnVisibility: Object.fromEntries(
          tableState.hiddenColumns.map((col) => [col, false])
        ),
      }}
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
