import { Layers } from 'lucide-react';

import { useAuthorizations, useCurrentUser } from '@/react/hooks/useUser';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { useRepeater } from '@@/datatables/useRepeater';

import { isExternalStack, isOrphanedStack } from '../../view-models/utils';

import { TableActions } from './TableActions';
import { TableSettingsMenus } from './TableSettingsMenus';
import { createStore } from './store';
import { columns } from './columns';
import { DecoratedStack } from './types';

const tableKey = 'docker_stacks';
const settingsStore = createStore(tableKey);

export function StacksDatatable({
  onRemove,
  onReload,
  // isImageNotificationEnabled,
  dataset,
}: {
  onRemove: (items: Array<DecoratedStack>) => void;
  onReload: () => void;
  // isImageNotificationEnabled: boolean;
  dataset: Array<DecoratedStack>;
}) {
  const tableState = useTableState(settingsStore, tableKey);
  useRepeater(tableState.autoRefreshRate, onReload);
  const { isAdmin } = useCurrentUser();
  const canManageStacks = useAuthorizations([
    'PortainerStackCreate',
    'PortainerStackDelete',
  ]);
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
        allowSelection(item, isAdmin, canManageStacks)
      }
      getRowId={(item) => item.Id.toString()}
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

  if (isOrphanedStack(item) && !isAdmin) {
    return false;
  }

  return isAdmin || canManageStacks;
}
