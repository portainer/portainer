import { User as UserIcon } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { columns } from './columns';
import { DecoratedUser } from './types';

const store = createPersistedStore('users');

export function UsersDatatable({
  dataset,
  onRemove,
}: {
  dataset?: Array<DecoratedUser>;
  onRemove: (selectedItems: Array<DecoratedUser>) => void;
}) {
  const tableState = useTableState(store, 'users');

  return (
    <Datatable
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      title="Users"
      titleIcon={UserIcon}
      settingsManager={tableState}
      isRowSelectable={(row) => row.original.Id !== 1}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          disabled={selectedItems.length === 0}
          confirmMessage="Do you want to remove the selected users? They will not be able to login into Portainer anymore."
          onConfirmed={() => onRemove(selectedItems)}
        />
      )}
    />
  );
}
