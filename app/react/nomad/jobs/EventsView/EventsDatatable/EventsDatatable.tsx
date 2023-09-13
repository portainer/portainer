import { History } from 'lucide-react';

import { NomadEvent } from '@/react/nomad/types';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { columns } from './columns';

export interface EventsDatatableProps {
  data: NomadEvent[];
  isLoading: boolean;
}

const storageKey = 'nomad_events';

const settingsStore = createPersistedStore(storageKey, 'date');

export function EventsDatatable({ data, isLoading }: EventsDatatableProps) {
  const tableState = useTableState(settingsStore, storageKey);

  return (
    <Datatable
      isLoading={isLoading}
      settingsManager={tableState}
      columns={columns}
      dataset={data}
      titleIcon={History}
      title="Events"
      getRowId={(row) => `${row.Date}-${row.Message}-${row.Type}`}
      disableSelect
    />
  );
}
