import { ColumnDef } from '@tanstack/react-table';
import { List } from 'lucide-react';
import { useMemo } from 'react';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

const tableKey = 'container-processes';
const store = createPersistedStore(tableKey);

export function ProcessesDatatable({
  dataset,
  headers,
}: {
  dataset?: Array<Array<string | number>>;
  headers?: Array<string>;
}) {
  const tableState = useTableState(store, tableKey);
  const rows = useMemo(() => {
    if (!dataset || !headers) {
      return [];
    }

    return dataset.map((row, index) => ({
      id: index,
      ...Object.fromEntries(
        headers.map((header, index) => [header, row[index]])
      ),
    }));
  }, [dataset, headers]);

  const columns = useMemo(
    () =>
      headers
        ? headers.map(
            (header) =>
              ({ header, accessorKey: header }) satisfies ColumnDef<{
                [k: string]: string;
              }>
          )
        : [],
    [headers]
  );

  return (
    <Datatable
      title="Processes"
      titleIcon={List}
      dataset={rows}
      columns={columns}
      settingsManager={tableState}
      disableSelect
      isLoading={!dataset}
      emptyContentLabel="No processes found."
      data-cy="docker-container-stats-processes-datatable"
    />
  );
}
