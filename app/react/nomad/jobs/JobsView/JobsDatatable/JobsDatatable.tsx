import { Clock } from 'lucide-react';

import { Job } from '@/react/nomad/types';

import { useRepeater } from '@@/datatables/useRepeater';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { TableSettingsMenu } from '@@/datatables/TableSettingsMenu';
import { useTableState } from '@@/datatables/useTableState';

import { TasksDatatable } from './TasksDatatable';
import { columns } from './columns';
import { createStore } from './datatable-store';
import { JobsDatatableSettings } from './JobsDatatableSettings';

export interface JobsDatatableProps {
  jobs: Job[];
  refreshData: () => Promise<void>;
  isLoading?: boolean;
}

const storageKey = 'nomad_jobs';
const settingsStore = createStore(storageKey);

export function JobsDatatable({
  jobs,
  refreshData,
  isLoading,
}: JobsDatatableProps) {
  const tableState = useTableState(settingsStore, storageKey);
  useRepeater(tableState.autoRefreshRate, refreshData);

  return (
    <ExpandableDatatable
      dataset={jobs}
      columns={columns}
      settingsManager={tableState}
      title="Nomad Jobs"
      titleIcon={Clock}
      disableSelect
      emptyContentLabel="No jobs found"
      renderSubRow={(row) => <TasksDatatable data={row.original.Tasks} />}
      isLoading={isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <JobsDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      expandOnRowClick
    />
  );
}
