import { useEffect, useState } from 'react';

import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { react2angular } from '@/react-tools/react2angular';
import { useUser } from '@/portainer/hooks/useUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { TableSettingsProvider } from '@@/datatables/useTableSettings';
import { PageHeader } from '@@/PageHeader';

import { notificationsStore } from './notifications-store';
import { NotificationsDatatable } from './datatable/NotificationsDatatable';
import { ToastNotification } from './types';

export function NotificationsView() {
  const { user } = useUser();

  const [userNotifications, setUserNotifications] = useState<
    ToastNotification[]
  >(notificationsStore.getState().userNotifications[user.Id] || []);

  useEffect(
    () =>
      notificationsStore.subscribe((state) =>
        setUserNotifications(state.userNotifications[user.Id])
      ),
    [user.Id]
  );

  const breadcrumbs = [
    {
      label: 'Notifications',
    },
  ];

  const defaultSettings = {
    pageSize: 10,
    sortBy: {},
  };

  return (
    <>
      <PageHeader title="Notifications" breadcrumbs={breadcrumbs} reload />

      <div className="row">
        <div className="col-sm-12">
          <TableSettingsProvider
            defaults={defaultSettings}
            storageKey="notifications"
          >
            <NotificationsDatatable data={userNotifications} />
          </TableSettingsProvider>
        </div>
      </div>
    </>
  );
}

export const NotificationsViewAngular = react2angular(
  withUIRouter(withReactQuery(withCurrentUser(NotificationsView))),
  []
);
