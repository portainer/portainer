import { columnHelper } from './helper';

export const kind = columnHelper.accessor(
  (event) => event.involvedObject.kind,
  {
    header: 'Kind',
    cell: ({ row: { original: event } }) => event.involvedObject.kind,
  }
);
