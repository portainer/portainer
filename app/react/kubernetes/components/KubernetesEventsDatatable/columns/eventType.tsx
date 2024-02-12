import { Badge, BadgeType } from '@@/Badge';

import { columnHelper } from './helper';

export const eventType = columnHelper.accessor('type', {
  header: 'Type',
  cell: ({ getValue }) => (
    <Badge type={getBadgeColor(getValue())}>{getValue()}</Badge>
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
