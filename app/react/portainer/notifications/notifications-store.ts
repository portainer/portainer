import create from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';
import { UserId } from '@/portainer/users/types';

import { ToastNotification } from './types';

interface NotificationsState {
  userNotifications: Record<UserId, ToastNotification[]>;
  addNotification: (userId: number, notification: ToastNotification) => void;
  removeNotification: (userId: number, notificationId: string) => void;
  removeNotifications: (userId: number, notifications: string[]) => void;
  clearUserNotifications: (userId: number) => void;
}

export const notificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      userNotifications: {},
      addNotification: (userId: number, notification: ToastNotification) => {
        set((state) => {
          // keep the new notification at the start of the list, so sorting by newest time isn't required
          const newUserNotifications = [
            notification,
            ...(state.userNotifications[userId] || []),
          ];
          return {
            userNotifications: {
              ...state.userNotifications,
              [userId]: newUserNotifications,
            },
          };
        });
      },
      removeNotification: (userId: number, notificationId: string) => {
        set((state) => ({
          userNotifications: {
            ...state.userNotifications,
            [userId]: state.userNotifications[userId].filter(
              (notif) => notif.id !== notificationId
            ),
          },
        }));
      },
      removeNotifications: (userId: number, notificationIds: string[]) => {
        set((state) => ({
          userNotifications: {
            ...state.userNotifications,
            [userId]: state.userNotifications[userId].filter(
              (notification) => !notificationIds.includes(notification.id)
            ),
          },
        }));
      },
      clearUserNotifications: (userId: number) => {
        set((state) => ({
          userNotifications: {
            ...state.userNotifications,
            [userId]: [],
          },
        }));
      },
    }),
    {
      name: keyBuilder('notifications'),
    }
  )
);
