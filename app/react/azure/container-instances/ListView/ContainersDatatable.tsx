import { Box, Plus, Trash2 } from 'lucide-react';
import { useStore } from 'zustand';

import { ContainerGroup } from '@/react/azure/types';
import { Authorized } from '@/react/hooks/useUser';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { createPersistedStore } from '@@/datatables/types';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { columns } from './columns';

const tableKey = 'containergroups';

const settingsStore = createPersistedStore(tableKey, 'name');
export interface Props {
  dataset: ContainerGroup[];
  onRemoveClick(containerIds: string[]): void;
}

export function ContainersDatatable({ dataset, onRemoveClick }: Props) {
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(tableKey);

  return (
    <Datatable
      dataset={dataset}
      columns={columns}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      title="Containers"
      titleIcon={Box}
      getRowId={(container) => container.id}
      emptyContentLabel="No container available."
      renderTableActions={(selectedRows) => (
        <>
          <Authorized authorizations="AzureContainerGroupDelete">
            <Button
              color="dangerlight"
              disabled={selectedRows.length === 0}
              onClick={() => handleRemoveClick(selectedRows.map((r) => r.id))}
              icon={Trash2}
            >
              Remove
            </Button>
          </Authorized>

          <Authorized authorizations="AzureContainerGroupCreate">
            <Link to="azure.containerinstances.new" className="space-left">
              <Button icon={Plus}>Add container</Button>
            </Link>
          </Authorized>
        </>
      )}
    />
  );

  async function handleRemoveClick(containerIds: string[]) {
    const confirmed = await confirmDelete(
      'Are you sure you want to delete the selected containers?'
    );
    if (!confirmed) {
      return null;
    }

    return onRemoveClick(containerIds);
  }
}
