import { History } from 'lucide-react';
import { useStore } from 'zustand';

import { NomadEvent } from '@/react/nomad/types';

import { Datatable } from '@@/datatables';
import { useSearchBarState } from '@@/datatables/SearchBar';
import { createPersistedStore } from '@@/datatables/types';

import { useColumns } from './columns';

export interface EventsDatatableProps {
  data: NomadEvent[];
  isLoading: boolean;
}

const storageKey = 'events';

const settingsStore = createPersistedStore(storageKey, 'Date');

export function EventsDatatable({ data, isLoading }: EventsDatatableProps) {
  const columns = useColumns();
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);

  return (
    <Datatable
      isLoading={isLoading}
      columns={columns}
      dataset={data}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      titleIcon={History}
      title="Events"
      totalCount={data.length}
      getRowId={(row) => `${row.Date}-${row.Message}-${row.Type}`}
      disableSelect
    />
  );
}
