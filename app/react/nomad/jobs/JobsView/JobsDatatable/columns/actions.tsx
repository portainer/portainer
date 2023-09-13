import { Clock } from 'lucide-react';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const actions = columnHelper.display({
  header: 'Job Actions',
  id: 'actions',
  meta: {
    width: '110px',
  },
  cell: ActionsCell,
});

export function ActionsCell() {
  return (
    <div className="text-center">
      <Icon icon={Clock} />
    </div>
  );
}
