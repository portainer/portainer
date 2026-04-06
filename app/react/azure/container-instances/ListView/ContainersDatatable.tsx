import { Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <Datatable
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      title={t('azure_containers.containers_title')}
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
              confirmMessage={t('azure_containers.delete_confirm')}
            />
          </Authorized>

          <Authorized authorizations="AzureContainerGroupCreate">
            <AddButton data-cy="add-container-button">{t('azure_containers.add_container')}</AddButton>
          </Authorized>
        </div>
      )}
    />
  );

  async function handleRemoveClick(containerIds: string[]) {
    return onRemoveClick(containerIds);
  }
}
