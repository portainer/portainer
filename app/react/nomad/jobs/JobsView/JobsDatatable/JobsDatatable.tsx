import { useStore } from 'zustand';
import { Clock } from 'react-feather';

import { Job } from '@/react/nomad/types';

import { useRepeater } from '@@/datatables/useRepeater';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { TableSettingsMenu } from '@@/datatables';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { TasksDatatable } from './TasksDatatable';
import { columns } from './columns';
import { createStore } from './datatable-store';
import { JobsDatatableSettings } from './JobsDatatableSettings';

export interface JobsDatatableProps {
  jobs: Job[];
  refreshData: () => Promise<void>;
  isLoading?: boolean;
}

const storageKey = 'jobs';
const settingsStore = createStore(storageKey);

export function JobsDatatable({
  jobs,
  refreshData,
  isLoading,
}: JobsDatatableProps) {
  const [search, setSearch] = useSearchBarState(storageKey);
  const settings = useStore(settingsStore);
  useRepeater(settings.autoRefreshRate, refreshData);

  return (
    <ExpandableDatatable<Job>
      dataset={jobs}
      columns={columns}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      title="Nomad Jobs"
      titleIcon={Clock}
      disableSelect
      emptyContentLabel="No jobs found"
      renderSubRow={(row) => <TasksDatatable data={row.original.Tasks} />}
      isLoading={isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <JobsDatatableSettings settings={settings} />
        </TableSettingsMenu>
      )}
    />
  );
}
