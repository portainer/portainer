import { Dice4 } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useEnvironmentGroups } from '../../queries/useEnvironmentGroups';

import { columns } from './columns';
import { TableActions } from './TableActions';

const tableKey = 'environment-groups';
const store = createPersistedStore(tableKey);

export function EnvironmentGroupsDatatable() {
  const query = useEnvironmentGroups();
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      columns={columns}
      isLoading={query.isLoading}
      dataset={query.data || []}
      settingsManager={tableState}
      title="Environment Groups"
      titleIcon={Dice4}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} />
      )}
      data-cy="environment-groups-datatable"
    />
  );
}
