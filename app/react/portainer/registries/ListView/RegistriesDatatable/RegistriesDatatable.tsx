import { Radio } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useRegistries } from '../../queries/useRegistries';

import { columns } from './columns';
import { DeleteButton } from './DeleteButton';
import { AddButton } from './AddButton';

const tableKey = 'registries';

const store = createPersistedStore(tableKey);

export function RegistriesDatatable() {
  const query = useRegistries();

  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      columns={columns}
      dataset={query.data || []}
      isLoading={query.isLoading}
      settingsManager={tableState}
      title="Registries"
      titleIcon={Radio}
      renderTableActions={(selectedItems) => (
        <>
          <DeleteButton selectedItems={selectedItems} />

          <AddButton />
        </>
      )}
      isRowSelectable={(row) => !!row.original.Id}
      data-cy="registries-datatable"
    />
  );
}
