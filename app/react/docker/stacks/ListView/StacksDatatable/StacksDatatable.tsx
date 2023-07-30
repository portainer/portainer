import { Layers } from 'lucide-react';

import { isEnvironmentAdmin, useCurrentUser } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { useRepeater } from '@@/datatables/useRepeater';

import { isExternalStack } from '../../view-models/utils';

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
  const { user } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const isAdmin = isEnvironmentAdmin(user, environmentId);

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
        !isExternalStack(item) && (isAdmin || !item.Orphaned)
      }
      getRowId={(item) => item.Id.toString()}
    />
  );
}
