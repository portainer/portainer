import { Badge, BadgeType } from '@@/Badge';

import { columnHelper } from './helper';

export const type = columnHelper.accessor('type', {
  header: 'Type',
  cell: ({ row: { original: event } }) => (
    <Badge type={getBadgeColor(event.type)}>{event.type}</Badge>
  ),
});

function getBadgeColor(status?: string): BadgeType {
  switch (status?.toLowerCase()) {
    case 'normal':
      return 'info';
    case 'warning':
      return 'warn';
    default:
      return 'danger';
  }
}
