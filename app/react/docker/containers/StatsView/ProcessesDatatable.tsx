import { ColumnDef } from '@tanstack/react-table';
import { List } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useContainerTop } from '../queries/useContainerTop';
import { ContainerProcesses } from '../queries/types';

const tableKey = 'container-processes';
const store = createPersistedStore(tableKey);

type ProcessRow = {
  id: number;
};

type ProcessesDatatableProps = {
  rows: Array<ProcessRow>;
  columns: Array<ColumnDef<ProcessRow>>;
};

export function ProcessesDatatable() {
  const {
    params: { id: containerId },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();
  const topQuery = useContainerTop(
    environmentId,
    containerId,
    (containerProcesses: ContainerProcesses) =>
      parseContainerProcesses(containerProcesses)
  );
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      title="Processes"
      titleIcon={List}
      dataset={topQuery.data?.rows ?? []}
      columns={topQuery.data?.columns ?? []}
      settingsManager={tableState}
      disableSelect
      isLoading={topQuery.isLoading}
      data-cy="docker-container-stats-processes-datatable"
    />
  );
}

// transform the data from the API into the format expected by the datatable
function parseContainerProcesses(
  containerProcesses: ContainerProcesses
): ProcessesDatatableProps {
  const { Processes: processes, Titles: titles } = containerProcesses;
  const rows = processes?.map((row, index) => {
    // docker has the row data as an array of many strings
    // podman has the row data as an array with a single string separated by one or many spaces
    const processArray = row.length === 1 ? row[0].split(/\s+/) : row;
    return {
      id: index,
      ...Object.fromEntries(
        titles.map((header, index) => [header, processArray[index]])
      ),
    };
  });

  const columns = titles
    ? titles.map(
        (header) =>
          ({ header, accessorKey: header }) satisfies ColumnDef<{
            [k: string]: string;
          }>
      )
    : [];

  return {
    rows,
    columns,
  };
}
