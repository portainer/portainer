import { columnHelper } from './helper';

export const statusMessage = columnHelper.accessor((row) => row.statusMessage, {
  header: 'Status message',
  id: 'statusMessage',
  cell: ({ row }) => (
    <div className="whitespace-pre-wrap">
      <span>{row.original.statusMessage || '-'}</span>
    </div>
  ),
});
