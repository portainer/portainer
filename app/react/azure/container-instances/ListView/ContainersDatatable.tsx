import { Box, Plus, Trash2 } from 'lucide-react';

import { ContainerGroup } from '@/react/azure/types';
import { Authorized } from '@/react/hooks/useUser';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { columns } from './columns';

const tableKey = 'containergroups';

const settingsStore = createPersistedStore(tableKey, 'name');
export interface Props {
  dataset: ContainerGroup[];
  onRemoveClick(containerIds: string[]): void;
}

export function ContainersDatatable({ dataset, onRemoveClick }: Props) {
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <Datatable
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      title="Containers"
      titleIcon={Box}
      getRowId={(container) => container.id}
      emptyContentLabel="No container available."
      renderTableActions={(selectedRows) => (
        <>
          <Authorized authorizations="AzureContainerGroupDelete">
            <Button
              color="dangerlight"
              disabled={selectedRows.length === 0}
              onClick={() => handleRemoveClick(selectedRows.map((r) => r.id))}
              icon={Trash2}
            >
              Remove
            </Button>
          </Authorized>

          <Authorized authorizations="AzureContainerGroupCreate">
            <Link to="azure.containerinstances.new" className="space-left">
              <Button icon={Plus}>Add container</Button>
            </Link>
          </Authorized>
        </>
      )}
    />
  );

  async function handleRemoveClick(containerIds: string[]) {
    const confirmed = await confirmDelete(
      'Are you sure you want to delete the selected containers?'
    );
    if (!confirmed) {
      return null;
    }

    return onRemoveClick(containerIds);
  }
}
