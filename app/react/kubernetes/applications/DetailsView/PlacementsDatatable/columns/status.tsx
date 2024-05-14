import { Check, X } from 'lucide-react';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const status = columnHelper.accessor('acceptsApplication', {
  header: '',
  id: 'status',
  enableSorting: false,
  cell: ({ getValue }) => {
    const acceptsApplication = getValue();
    return (
      <div className="flex items-center h-full">
        <Icon
          icon={acceptsApplication ? Check : X}
          mode={acceptsApplication ? 'success' : 'danger'}
          size="sm"
        />
      </div>
    );
  },
  meta: {
    width: 30,
  },
  enableResizing: false,
});
