import { Clock, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import _ from 'lodash';

import { notifySuccess } from '@/portainer/services/notifications';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import { useList } from '../queries/list';
import { EdgeUpdateSchedule, StatusType } from '../types';
import { useRemoveMutation } from '../queries/useRemoveMutation';
import { BetaAlert } from '../common/BetaAlert';

import { columns } from './columns';
import { createStore } from './datatable-store';
import { DecoratedItem } from './types';

const storageKey = 'update-schedules-list';
const settingsStore = createStore(storageKey);

export default withLimitToBE(ListView);

export function ListView() {
  const tableState = useTableState(settingsStore, storageKey);

  const listQuery = useList(true);
  const groupsQuery = useEdgeGroups({
    select: (groups) => Object.fromEntries(groups.map((g) => [g.Id, g.Name])),
  });

  const items: Array<DecoratedItem> = useMemo(() => {
    if (!listQuery.data || !groupsQuery.data) {
      return [];
    }

    return listQuery.data.map((item) => ({
      ...item,
      edgeGroupNames: _.compact(
        item.edgeGroupIds.map((id) => groupsQuery.data[id])
      ),
    }));
  }, [listQuery.data, groupsQuery.data]);

  if (!listQuery.data || !groupsQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Update & Rollback"
        reload
        breadcrumbs="Update and rollback"
      />

      <BetaAlert
        className="ml-[15px] mb-2"
        message="Beta feature - currently limited to standalone Linux and Nomad edge devices."
      />

      <Datatable
        dataset={items}
        columns={columns}
        settingsManager={tableState}
        title="Update & rollback"
        titleIcon={Clock}
        emptyContentLabel="No schedules found"
        isLoading={listQuery.isLoading}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        isRowSelectable={(row) => row.original.status === StatusType.Pending}
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
    const confirmed = await confirmDelete(
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
