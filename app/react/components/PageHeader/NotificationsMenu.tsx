import clsx from 'clsx';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import { UISrefProps, useSref } from '@uirouter/react';
import Moment from 'moment';
import { useStore } from 'zustand';
import { AlertCircle, Bell, CheckCircle, Trash2 } from 'lucide-react';

import { AutomationTestingProps } from '@/types';
import { useUser } from '@/react/hooks/useUser';
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
  const reducedNotifications = userNotifications?.slice(0, 50);

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
            'icon-badge mr-1 !p-2 text-lg',
            'text-gray-8',
            'th-dark:text-gray-warm-7'
          )}
        >
          <Icon icon={Bell} />
          <span
            className={
              reducedNotifications?.length > 0 ? notificationStyles.badge : ''
            }
          />
        </div>
      </MenuButton>

      <MenuList
        className={clsx(headerStyles.menuList, notificationStyles.root)}
        aria-label="Notifications Menu"
        data-cy="notificationsMenu"
      >
        <div>
          <div
            className={clsx(
              notificationStyles.notificationContainer,
              'vertical-center'
            )}
          >
            <div>
              <h4>Notifications</h4>
            </div>
            <div className={notificationStyles.itemLast}>
              {reducedNotifications?.length > 0 && (
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
        {reducedNotifications?.length > 0 ? (
          <>
            <div className={notificationStyles.notifications}>
              {reducedNotifications.map((notification, index) => (
                <MenuLink
                  to="portainer.notifications"
                  params={{ id: notification.id }}
                  notification={notification}
                  key={notification.id}
                  onDelete={() => onDelete(notification.id)}
                  data-cy={`notification-delete-button_${index}`}
                />
              ))}
            </div>

            <div className={notificationStyles.notificationLink}>
              <Link
                to="portainer.notifications"
                data-cy="notifications-see-all-link"
              >
                View all notifications
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Icon icon={Bell} size="xl" />
            <p className="my-5">You have no notifications yet.</p>
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

function MenuLink({ to, params, notification, onDelete }: MenuLinkProps) {
  const anchorProps = useSref(to, params);

  return (
    <ReachMenuLink
      href={anchorProps.href}
      onClick={anchorProps.onClick}
      className={clsx(headerStyles.menuLink, notificationStyles.notification)}
    >
      <div className={notificationStyles.container}>
        <div className={notificationStyles.notificationIcon}>
          {notification.type === 'success' ? (
            <Icon icon={CheckCircle} size="lg" mode="success" />
          ) : (
            <Icon icon={AlertCircle} size="lg" mode="danger" />
          )}
        </div>
        <div className={notificationStyles.notificationBody}>
          <p className={notificationStyles.notificationTitle}>
            {notification.title}
          </p>
          <p className={notificationStyles.notificationDetails}>
            {notification.details}
          </p>
          <p className="small text-muted">
            {formatTime(notification.timeStamp)}
          </p>
        </div>
        <div className={notificationStyles.deleteButton}>
          <Button
            color="none"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            data-cy="notification-deleteButton"
            size="large"
            icon={Trash2}
          />
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
