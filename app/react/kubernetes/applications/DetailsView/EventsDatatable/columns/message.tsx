import { columnHelper } from './helper';

export const message = columnHelper.accessor('message', {
  header: 'Message',
  cell: ({ row: { original: event } }) => event.message,
});
