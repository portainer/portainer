import { createColumnHelper } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { multiple } from '@@/datatables/filter-types';
import { filterHOC } from '@@/datatables/Filter';
import { Icon } from '@@/Icon';

import { ActivityType, AuthLog, AuthMethodType } from './types';

const columnHelper = createColumnHelper<AuthLog>();

export function getColumns(t: (key: string) => string) {
  const activityTypesProps = {
    [ActivityType.AuthSuccess]: {
      label: t('logs.result.success'),
      icon: Check,
      mode: 'success',
    },
    [ActivityType.AuthFailure]: {
      label: t('logs.result.failure'),
      icon: X,
      mode: 'danger',
    },
    [ActivityType.Logout]: { label: t('logs.result.logout'), icon: undefined, mode: undefined },
  } as const;

  const authMethodLabel = (context?: number) => {
    switch (context) {
      case AuthMethodType.Internal:
        return t('logs.context.internal');
      case AuthMethodType.LDAP:
        return t('logs.context.ldap');
      case AuthMethodType.OAuth:
        return t('logs.context.oauth');
      default:
        return '';
    }
  };

  return [
    columnHelper.accessor('timestamp', {
      header: t('logs.columns.time'),
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? isoDateFromTimestamp(value) : '';
      },
    }),
    columnHelper.accessor('origin', {
      header: t('logs.columns.origin'),
    }),
    columnHelper.accessor(({ context }) => authMethodLabel(context) || '', {
      header: t('logs.columns.context'),
      enableColumnFilter: true,
      filterFn: multiple,
      meta: {
        filter: filterHOC('Filter'),
      },
    }),
    columnHelper.accessor('username', {
      header: t('logs.columns.user'),
    }),

    columnHelper.accessor((item) => activityTypesProps[item.type].label, {
      header: t('logs.columns.result'),
      enableColumnFilter: true,
      filterFn: multiple,
      meta: {
        filter: filterHOC('Filter'),
      },
      cell({ row: { original: item } }) {
        const props = activityTypesProps[item.type];
        if (!props) {
          return null;
        }

        const { label, icon, mode } = props;

        return (
          <span className="flex gap-1 items-center">
            {label}
            {icon && mode && <Icon icon={icon} mode={mode} />}
          </span>
        );
      },
    }),
  ];
}
