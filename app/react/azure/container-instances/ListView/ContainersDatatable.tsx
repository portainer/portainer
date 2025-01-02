import { Box } from 'lucide-react';

import { ContainerGroup } from '@/react/azure/types';
import { Authorized } from '@/react/hooks/useUser';

import { Datatable } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

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
      data-cy="containers-datatable"
      renderTableActions={(selectedRows) => (
        <div className="flex gap-2">
          <Authorized authorizations="AzureContainerGroupDelete">
            <DeleteButton
              disabled={selectedRows.length === 0}
              data-cy="remove-containers-button"
              onConfirmed={() =>
                handleRemoveClick(selectedRows.map((r) => r.id))
              }
              confirmMessage="Are you sure you want to delete the selected containers?"
            />
          </Authorized>

          <Authorized authorizations="AzureContainerGroupCreate">
            <AddButton data-cy="add-container-button">Add container</AddButton>
          </Authorized>
        </div>
      )}
    />
  );

  async function handleRemoveClick(containerIds: string[]) {
    return onRemoveClick(containerIds);
  }
}
