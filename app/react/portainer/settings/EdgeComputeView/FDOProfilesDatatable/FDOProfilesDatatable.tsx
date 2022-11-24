import { List } from 'react-feather';
import { useStore } from 'zustand';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { useColumns } from './columns';
import { FDOProfilesDatatableActions } from './FDOProfilesDatatableActions';
import { useFDOProfiles } from './useFDOProfiles';

const storageKey = 'fdoProfiles';

const settingsStore = createPersistedStore(storageKey, 'name');

export interface FDOProfilesDatatableProps {
  isFDOEnabled: boolean;
}

export function FDOProfilesDatatable({
  isFDOEnabled,
}: FDOProfilesDatatableProps) {
  const columns = useColumns();
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);
  const { isLoading, profiles } = useFDOProfiles();

  return (
    <Datatable
      columns={columns}
      dataset={profiles}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      title="Device Profiles"
      titleIcon={List}
      disableSelect={!isFDOEnabled}
      emptyContentLabel="No profiles found"
      getRowId={(row) => row.id.toString()}
      isLoading={isLoading}
      renderTableActions={(selectedItems) => (
        <FDOProfilesDatatableActions
          isFDOEnabled={isFDOEnabled}
          selectedItems={selectedItems}
        />
      )}
    />
  );
}
