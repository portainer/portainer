import { createColumnHelper } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { multiple } from '@@/datatables/filter-types';
import { filterHOC } from '@@/datatables/Filter';
import { Icon } from '@@/Icon';

import { ActivityType, AuthLog, AuthMethodType } from './types';

const activityTypesProps = {
  [ActivityType.AuthSuccess]: {
    label: 'Authentication success',
    icon: Check,
    mode: 'success',
  },
  [ActivityType.AuthFailure]: {
    label: 'Authentication failure',
    icon: X,
    mode: 'danger',
  },
  [ActivityType.Logout]: { label: 'Logout', icon: undefined, mode: undefined },
} as const;

const columnHelper = createColumnHelper<AuthLog>();

export const columns = [
  columnHelper.accessor('timestamp', {
    header: 'Time',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? isoDateFromTimestamp(value) : '';
    },
  }),
  columnHelper.accessor('origin', {
    header: 'Origin',
  }),
  columnHelper.accessor(({ context }) => AuthMethodType[context] || '', {
    header: 'Context',
    enableColumnFilter: true,
    filterFn: multiple,
    meta: {
      filter: filterHOC('Filter'),
    },
  }),
  columnHelper.accessor('username', {
    header: 'User',
  }),

  columnHelper.accessor((item) => activityTypesProps[item.type].label, {
    header: 'Result',
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
