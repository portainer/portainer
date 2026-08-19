import moment from 'moment';
import { createColumnHelper } from '@tanstack/react-table';

import { WaitingRoomEnvironment } from '../types';

const columnHelper = createColumnHelper<WaitingRoomEnvironment>();

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    id: 'Name',
  }),
  columnHelper.accessor('EdgeID', {
    header: 'Edge ID',
    id: 'EdgeID',
  }),
  columnHelper.accessor((row) => row.EdgeGroups.join(', '), {
    header: 'Edge Groups',
    id: 'edge-groups',
    enableSorting: false,
    cell: ({ getValue }) => getValue() || '-',
  }),
  columnHelper.accessor((row) => row.Group, {
    header: 'Group',
    id: 'Group',
    cell: ({ getValue }) => getValue() || '-',
  }),
  columnHelper.accessor((row) => row.Tags.join(', '), {
    header: 'Tags',
    id: 'tags',
    enableSorting: false,
    cell: ({ getValue }) => getValue() || '-',
  }),
  columnHelper.accessor((row) => row.LastCheckInDate, {
    header: 'Last Check-in',
    id: 'LastCheckIn',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? moment(value * 1000).fromNow() : '-';
    },
  }),
];
