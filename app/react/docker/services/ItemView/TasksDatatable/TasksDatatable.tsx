import { List } from 'lucide-react';

import { Datatable } from '@@/datatables';
import {
  BasicTableSettings,
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import { useColumns } from './columns';
import { DecoratedTask } from './types';

const storageKey = 'docker-service-tasks';

interface TableSettings
  extends BasicTableSettings,
    FilteredColumnsTableSettings {}

export function TasksDatatable({
  dataset,
  isSlotColumnVisible,
  serviceName,
}: {
  dataset: DecoratedTask[];
  isSlotColumnVisible: boolean;
  serviceName: string;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
  const columns = useColumns(isSlotColumnVisible);

  return (
    <Datatable
      title="Tasks"
      titleIcon={List}
      settingsManager={tableState}
      columns={columns}
      dataset={dataset}
      emptyContentLabel="No task available."
      extendTableOptions={mergeOptions(
        withMeta({ table: 'tasks', serviceName }),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      disableSelect
      data-cy="docker-service-tasks-datatable"
    />
  );
}
