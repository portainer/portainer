import { Check, X } from 'lucide-react';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const status = columnHelper.accessor('AcceptsApplication', {
  header: '',
  id: 'status',
  enableSorting: false,
  cell: ({ getValue }) => {
    const acceptsApplication = getValue();
    return (
      <Icon
        icon={acceptsApplication ? Check : X}
        mode={acceptsApplication ? 'success' : 'danger'}
        size="sm"
      />
    );
  },
  meta: {
    width: 30,
  },
  enableResizing: false,
});
