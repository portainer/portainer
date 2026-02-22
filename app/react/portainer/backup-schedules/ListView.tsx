import { useMemo } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { Link } from '@@/Link';
import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { useBackupSchedules, useDeleteBackupSchedule } from './queries';
import { BackupSchedule } from './types';
import { confirmDelete } from '@@/modals/confirm';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';

const storageKey = 'backupSchedules';
const tableStore = createPersistedStore(storageKey, 'Name');

const columnHelper = createColumnHelper<BackupSchedule>();

export function BackupSchedulesListView() {
  const query = useBackupSchedules();
  const deleteMutation = useDeleteBackupSchedule();

  const tableState = useTableState(tableStore, storageKey);

  const columns = useMemo(
    () => [
      columnHelper.accessor('Name', {
        header: 'Name',
        cell: ({ row, getValue }: CellContext<BackupSchedule, string>) => (
          <Link to="portainer.backupSchedules.edit" params={{ id: row.original.Id }} data-cy="backupSchedule-link">
            {getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('Schedule', {
        header: 'Schedule',
      }),
      columnHelper.accessor(row => row.Retention?.Days, {
        header: 'Retention (Days)',
        id: 'retention',
      }),
      columnHelper.accessor('LastRun', {
        header: 'Last Run',
        cell: ({ getValue }: CellContext<BackupSchedule, number>) => {
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
        cell: ({ row }: CellContext<BackupSchedule, unknown>) => (
          <Button
            color="danger"
            disabled={deleteMutation.isLoading}
            onClick={() => handleDelete(row.original.Id)}
            icon={Trash2}
            data-cy={`backupSchedule-delete-${row.original.Id}`}
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
        title="Backup Schedules"
        breadcrumbs={['Backup Schedules']}
        reload
      />

      <Datatable
        title="Backup Schedules"
        dataset={query.data || []}
        columns={columns}
        settingsManager={tableState}
        isLoading={query.isLoading}
        data-cy="backupSchedules-datatable"
        renderTableActions={() => (
          <Button
            as={Link}
            props={{ to: "portainer.backupSchedules.new" }}
            icon={Plus}
            data-cy="backupSchedule-create"
          >
            Create Schedule
          </Button>
        )}
      />
    </>
  );
}
