import { Clock, Trash2 } from 'react-feather';
import { useStore } from 'zustand';

import {
  FeatureFlag,
  useRedirectFeatureFlag,
} from '@/react/portainer/feature-flags/useRedirectFeatureFlag';
import { notifySuccess } from '@/portainer/services/notifications';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { useList } from '../queries/list';
import { EdgeUpdateSchedule } from '../types';
import { useRemoveMutation } from '../queries/useRemoveMutation';

import { columns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'update-schedules-list';
const settingsStore = createStore(storageKey);

export function ListView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);

  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);

  const listQuery = useList();

  if (!listQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Update & Rollback"
        reload
        breadcrumbs="Update and rollback"
      />

      <Datatable
        dataset={listQuery.data}
        columns={columns}
        title="Update & rollback"
        titleIcon={Clock}
        emptyContentLabel="No schedules found"
        isLoading={listQuery.isLoading}
        totalCount={listQuery.data.length}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        initialPageSize={settings.pageSize}
        onPageSizeChange={settings.setPageSize}
        initialSortBy={settings.sortBy}
        onSortByChange={settings.setSortBy}
        searchValue={search}
        onSearchChange={setSearch}
      />
    </>
  );
}

function TableActions({
  selectedRows,
}: {
  selectedRows: EdgeUpdateSchedule[];
}) {
  const removeMutation = useRemoveMutation();
  return (
    <>
      <Button
        icon={Trash2}
        color="dangerlight"
        onClick={() => handleRemove()}
        disabled={selectedRows.length === 0}
      >
        Remove
      </Button>

      <Link to=".create">
        <Button>Add update & rollback schedule</Button>
      </Link>
    </>
  );

  async function handleRemove() {
    const confirmed = await confirmDeletionAsync(
      'Are you sure you want to remove these?'
    );
    if (!confirmed) {
      return;
    }

    removeMutation.mutate(selectedRows, {
      onSuccess: () => {
        notifySuccess('Success', 'Schedules successfully removed');
      },
    });
  }
}
