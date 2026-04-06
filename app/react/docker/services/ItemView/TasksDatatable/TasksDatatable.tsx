import { List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Datatable } from '@@/datatables';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import {
  BasicTableSettings,
  filteredColumnsSettings,
  type FilteredColumnsTableSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';

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
  const { t } = useTranslation();
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
      title={t('docker.services.tasks.table_title')}
      titleIcon={List}
      settingsManager={tableState}
      columns={columns}
      dataset={dataset}
      extendTableOptions={mergeOptions(
        withMeta({ table: 'tasks', serviceName }),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      disableSelect
      data-cy="docker-service-tasks-datatable"
    />
  );
}
