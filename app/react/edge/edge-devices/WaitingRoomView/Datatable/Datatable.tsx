import { Box } from 'lucide-react';

import { Datatable as GenericDatatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { WaitingRoomEnvironment } from '../types';

import { columns } from './columns';
import { Filter } from './Filter';
import { TableActions } from './TableActions';
import { useEnvironments } from './useEnvironments';

const storageKey = 'edge-devices-waiting-room';

const settingsStore = createPersistedStore(storageKey, 'name');

export function Datatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const {
    data: environments,
    totalCount,
    isLoading,
    page,
    setPage,
  } = useEnvironments({
    pageLimit: tableState.pageSize,
    search: tableState.search,
    sortBy: tableState.sortBy,
  });

  return (
    <GenericDatatable<WaitingRoomEnvironment>
      settingsManager={tableState}
      columns={columns}
      dataset={environments}
      title="Edge Devices Waiting Room"
      titleIcon={Box}
      renderTableActions={(selectedRows) => (
        <TableActions selectedRows={selectedRows} />
      )}
      isLoading={isLoading}
      isServerSidePagination
      page={page}
      onPageChange={setPage}
      totalCount={totalCount}
      description={<Filter />}
      data-cy="edge-devices-waiting-room-datatable"
    />
  );
}
