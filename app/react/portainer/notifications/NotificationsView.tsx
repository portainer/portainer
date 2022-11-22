import { Bell, Trash2 } from 'react-feather';
import { useStore } from 'zustand';
import { useCurrentStateAndParams } from '@uirouter/react';

import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { react2angular } from '@/react-tools/react2angular';
import { useUser } from '@/react/hooks/useUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { PageHeader } from '@@/PageHeader';
import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { createPersistedStore } from '@@/datatables/types';
import { useSearchBarState } from '@@/datatables/SearchBar';

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
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);

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
        emptyContentLabel="No notifications found"
        totalCount={userNotifications.length}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        initialPageSize={settings.pageSize}
        onPageSizeChange={settings.setPageSize}
        initialSortBy={settings.sortBy}
        onSortByChange={settings.setSortBy}
        searchValue={search}
        onSearchChange={setSearch}
        getRowId={(row) => row.id}
        highlightedItemId={activeItemId}
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
