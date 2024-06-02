import { Bell } from 'lucide-react';
import { useStore } from 'zustand';
import { useCurrentStateAndParams } from '@uirouter/react';

import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { react2angular } from '@/react-tools/react2angular';
import { useUser } from '@/react/hooks/useUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { PageHeader } from '@@/PageHeader';
import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { notificationsStore } from './notifications-store';
import { ToastNotification } from './types';
import { columns } from './columns';

const storageKey = 'notifications-list';
const settingsStore = createPersistedStore(storageKey, {
  id: 'time',
  desc: true,
});

export function NotificationsView() {
  const { user } = useUser();

  const userNotifications: ToastNotification[] =
    useStore(notificationsStore, (state) => state.userNotifications[user.Id]) ||
    [];

  const breadcrumbs = 'Notifications';
  const tableState = useTableState(settingsStore, storageKey);

  const {
    params: { id: activeItemId },
  } = useCurrentStateAndParams();

  return (
    <>
      <PageHeader title="Notifications" breadcrumbs={breadcrumbs} reload />
      <Datatable
        columns={columns}
        title="Notifications"
        titleIcon={Bell}
        dataset={userNotifications}
        settingsManager={tableState}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        getRowId={(row) => row.id}
        highlightedItemId={activeItemId}
        data-cy="notifications-datatable"
      />
    </>
  );
}

function TableActions({ selectedRows }: { selectedRows: ToastNotification[] }) {
  const { user } = useUser();
  const notificationsStoreState = useStore(notificationsStore);
  return (
    <DeleteButton
      onConfirmed={() => handleRemove()}
      disabled={selectedRows.length === 0}
      data-cy="remove-notifications-button"
      confirmMessage="Are you sure you want to remove the selected notifications?"
    />
  );

  function handleRemove() {
    const { removeNotifications } = notificationsStoreState;
    const ids = selectedRows.map((row) => row.id);
    removeNotifications(user.Id, ids);
  }
}

export const NotificationsViewAngular = react2angular(
  withUIRouter(withReactQuery(withCurrentUser(NotificationsView))),
  []
);
