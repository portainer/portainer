import moment from 'moment';
import { createColumnHelper } from '@tanstack/react-table';

import { WaitingRoomEnvironment } from '../types';

const columnHelper = createColumnHelper<WaitingRoomEnvironment>();

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    id: 'name',
  }),
  columnHelper.accessor('EdgeID', {
    header: 'Edge ID',
    id: 'edge-id',
  }),
  columnHelper.accessor((row) => row.EdgeGroups.join(', ') || '-', {
    header: 'Edge Groups',
    id: 'edge-groups',
  }),
  columnHelper.accessor((row) => row.Group || '-', {
    header: 'Group',
    id: 'group',
  }),
  columnHelper.accessor((row) => row.Tags.join(', ') || '-', {
    header: 'Tags',
    id: 'tags',
  }),
  columnHelper.accessor((row) => row.LastCheckInDate, {
    header: 'Last Check-in',
    id: 'last-check-in',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? moment(value * 1000).fromNow() : '-';
    },
  }),
];
