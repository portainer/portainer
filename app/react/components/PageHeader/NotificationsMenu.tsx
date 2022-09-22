import clsx from 'clsx';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import { UISrefProps, useSref } from '@uirouter/react';
import Moment from 'moment';
import { useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { AutomationTestingProps } from '@/types';
import { useUser } from '@/portainer/hooks/useUser';
import { ToastNotification } from '@/react/portainer/notifications/types';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { notificationsStore } from '../../portainer/notifications/notifications-store';

import headerStyles from './HeaderTitle.module.css';
import notificationStyles from './NotificationsMenu.module.css';

export function NotificationsMenu() {
  const notificationsStoreState = useStore(notificationsStore);
  const { removeNotification } = notificationsStoreState;
  const { clearUserNotifications } = notificationsStoreState;

  const { user } = useUser();
  const userNotifications: ToastNotification[] = useStore(
    notificationsStore,
    (state) => state.userNotifications[user.Id]
  );

  const [badge, setBadge] = useState(false);

  useEffect(() => {
    if (userNotifications?.length > 0) {
      setBadge(true);
    } else {
      setBadge(false);
    }
  }, [userNotifications]);

  return (
    <Menu>
      <MenuButton
        className={clsx(
          'ml-auto flex items-center gap-1 self-start',
          headerStyles.menuButton
        )}
        data-cy="notificationsMenu-button"
        aria-label="Notifications menu toggle"
      >
        <div
          className={clsx(
            headerStyles.menuIcon,
            'icon-badge text-lg !p-2 mr-1',
            'text-gray-8',
            'th-dark:text-gray-warm-7'
          )}
        >
          <Icon icon="bell" feather />
          <span className={badge ? clsx(notificationStyles.badge) : ''} />
        </div>
      </MenuButton>

      <MenuList
        className={headerStyles.menuList}
        aria-label="Notifications Menu"
        data-cy="notificationsMenu"
      >
        <div>
          <div className={clsx(notificationStyles.notificationContainer)}>
            <div>
              <h4>Notifications</h4>
            </div>
            <div className={clsx(notificationStyles.itemLast)}>
              {userNotifications?.length > 0 && (
                <Button
                  color="none"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClear();
                  }}
                  data-cy="notification-deleteButton"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>
        {userNotifications?.length > 0 ? (
          <>
            {userNotifications.map((notification) => (
              <MenuLink
                to="portainer.notifications"
                params={{ notificationFrom: notification.timeStamp }}
                notification={notification}
                key={notification.id}
                onDelete={() => onDelete(notification.id)}
              />
            ))}

            <div className={clsx(notificationStyles.notificationLink)}>
              <Link to="portainer.notifications">View all notifications</Link>
            </div>
          </>
        ) : (
          <div>
            <Icon icon="bell" feather size="xl" />
            <div>
              <p>You have no notifications yet.</p>
            </div>
          </div>
        )}
      </MenuList>
    </Menu>
  );

  function onDelete(notificationId: string) {
    removeNotification(user.Id, notificationId);
  }

  function onClear() {
    clearUserNotifications(user.Id);
  }
}

interface MenuLinkProps extends AutomationTestingProps, UISrefProps {
  notification: ToastNotification;
  onDelete: () => void;
}

function MenuLink({
  to,
  params,
  options,
  notification,
  onDelete,
}: MenuLinkProps) {
  const anchorProps = useSref(to, params, options);

  return (
    <ReachMenuLink href={anchorProps.href} className={headerStyles.menuLink}>
      <div className={clsx(notificationStyles.container)}>
        <div className={clsx(notificationStyles.notificationIcon)}>
          {notification.type === 'success' ? (
            <Icon icon="check-circle" feather size="lg" mode="success" />
          ) : (
            <Icon icon="alert-circle" feather size="lg" mode="danger" />
          )}
        </div>
        <div className={clsx(notificationStyles.notificationBody)}>
          <p className={clsx(notificationStyles.notificationTitle)}>
            {notification.title}
          </p>
          <p>{notification.details}</p>
          <p className="small text-muted">
            {formatTime(notification.timeStamp)}
          </p>
        </div>
        <div className={clsx(notificationStyles.deleteButton)}>
          <Button
            color="none"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            data-cy="notification-deleteButton"
            size="large"
          >
            <Icon icon="trash-2" feather />
          </Button>
        </div>
      </div>
    </ReachMenuLink>
  );
}

function formatTime(timeCreated: Date) {
  const timeStamp = new Date(timeCreated).valueOf().toString();

  const diff = Math.floor((Date.now() - parseInt(timeStamp, 10)) / 1000);

  if (diff <= 86400) {
    let interval = Math.floor(diff / 3600);
    if (interval >= 1) {
      return `${interval} hours ago`;
    }
    interval = Math.floor(diff / 60);
    if (interval >= 1) {
      return `${interval} min ago`;
    }
  }
  if (diff > 86400) {
    const formatDate = Moment(timeCreated).format('YYYY-MM-DD h:mm:ss');
    return formatDate;
  }
  return 'Just now';
}
