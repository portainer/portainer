import { Clock, Trash2 } from 'react-feather';

import {
  FeatureFlag,
  useRedirectFeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';
import { notifySuccess } from '@/portainer/services/notifications';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { useList } from '../queries/list';
import { EdgeUpdateSchedule } from '../types';
import { useRemoveMutation } from '../queries/useRemoveMutation';

import { columns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'update-schedules-list';
const useStore = createStore(storageKey);

export function ListView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);
  const listQuery = useList();
  const store = useStore();

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
        columns={columns}
        titleOptions={{
          title: 'Update & rollback',
          icon: Clock,
        }}
        dataset={listQuery.data}
        settingsStore={store}
        storageKey={storageKey}
        emptyContentLabel="No schedules found"
        isLoading={listQuery.isLoading}
        totalCount={listQuery.data.length}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
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
