import { Bell, Trash2 } from 'react-feather';
import { useStore } from 'zustand';
import { useCurrentStateAndParams } from '@uirouter/react';

import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { react2angular } from '@/react-tools/react2angular';
import { useUser } from '@/portainer/hooks/useUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { PageHeader } from '@@/PageHeader';
import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';

import { notificationsStore } from './notifications-store';
import { ToastNotification } from './types';
import { columns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'notifications-list';
const useSettingsStore = createStore(storageKey, 'time', true);

export function NotificationsView() {
  const settingsStore = useSettingsStore();
  const { user } = useUser();

  const userNotifications: ToastNotification[] =
    useStore(notificationsStore, (state) => state.userNotifications[user.Id]) ||
    [];

  const breadcrumbs = 'Notifications';

  const {
    params: { id },
  } = useCurrentStateAndParams();

  return (
    <>
      <PageHeader title="Notifications" breadcrumbs={breadcrumbs} reload />
      <Datatable
        columns={columns}
        titleOptions={{
          title: 'Notifications',
          icon: Bell,
        }}
        dataset={userNotifications}
        settingsStore={settingsStore}
        storageKey="notifications"
        emptyContentLabel="No notifications found"
        totalCount={userNotifications.length}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        initialActiveItem={id}
      />
    </>
  );
}

function TableActions({ selectedRows }: { selectedRows: ToastNotification[] }) {
  const { user } = useUser();
  const notificationsStoreState = useStore(notificationsStore);
  return (
    <Button
      icon={Trash2}
      color="dangerlight"
      onClick={() => handleRemove()}
      disabled={selectedRows.length === 0}
    >
      Remove
    </Button>
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
