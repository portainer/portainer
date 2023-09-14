import { List } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useColumns } from './columns';
import { DecoratedTask } from './types';

const storageKey = 'docker-service-tasks';
const store = createPersistedStore(storageKey);

export function TasksDatatable({
  dataset,
  isSlotColumnVisible,
}: {
  dataset: DecoratedTask[];
  isSlotColumnVisible: boolean;
}) {
  const tableState = useTableState(store, storageKey);
  const columns = useColumns(isSlotColumnVisible);

  return (
    <Datatable
      title="Tasks"
      titleIcon={List}
      settingsManager={tableState}
      columns={columns}
      dataset={dataset}
      emptyContentLabel="No task available."
    />
  );
}
