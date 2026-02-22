import { useMemo } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { Link } from '@@/Link';
import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { useReplicationSchedules, useDeleteReplicationSchedule } from './queries';
import { ReplicationSchedule } from './types';
import { confirmDelete } from '@@/modals/confirm';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';

const storageKey = 'replicationSchedules';
const tableStore = createPersistedStore(storageKey, 'Name');

const columnHelper = createColumnHelper<ReplicationSchedule>();

export function ReplicationSchedulesListView() {
  const query = useReplicationSchedules();
  const deleteMutation = useDeleteReplicationSchedule();

  const tableState = useTableState(tableStore, storageKey);

  const columns = useMemo(
    () => [
      columnHelper.accessor('Name', {
        header: 'Name',
        cell: ({ row, getValue }: CellContext<ReplicationSchedule, string>) => (
          <Link to="portainer.replicationSchedules.edit" params={{ id: row.original.Id }} data-cy="replicationSchedule-link">
            {getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('Schedule', {
        header: 'Schedule',
      }),
      columnHelper.accessor(row => row.FailoverSettings?.Enabled ? 'Yes' : 'No', {
        header: 'Failover',
        id: 'failover',
      }),
      columnHelper.accessor('LastRun', {
        header: 'Last Run',
        cell: ({ getValue }: CellContext<ReplicationSchedule, number>) => {
           const val = getValue();
           return val ? new Date(val * 1000).toLocaleString() : '-';
        },
      }),
      columnHelper.accessor('Status', {
        header: 'Status',
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: CellContext<ReplicationSchedule, unknown>) => (
          <Button
            color="danger"
            disabled={deleteMutation.isLoading}
            onClick={() => handleDelete(row.original.Id)}
            icon={Trash2}
            data-cy={`replicationSchedule-delete-${row.original.Id}`}
          >
            Delete
          </Button>
        ),
      }),
    ],
    [deleteMutation.isLoading]
  );

  async function handleDelete(id: number) {
    if (await confirmDelete('Are you sure you want to delete this schedule?')) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <>
      <PageHeader
        title="Replication Schedules"
        breadcrumbs={['Replication Schedules']}
        reload
      />

      <Datatable
        title="Replication Schedules"
        dataset={query.data || []}
        columns={columns}
        settingsManager={tableState}
        isLoading={query.isLoading}
        data-cy="replicationSchedules-datatable"
        renderTableActions={() => (
          <Button
            as={Link}
            props={{ to: "portainer.replicationSchedules.new" }}
            icon={Plus}
            data-cy="replicationSchedule-create"
          >
            Create Schedule
          </Button>
        )}
      />
    </>
  );
}
