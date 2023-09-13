import clsx from 'clsx';

import { nodeStatusBadge } from '@/docker/filters/utils';

import { columnHelper } from './column-helper';

export const status = columnHelper.accessor('Status', {
  cell({ getValue }) {
    const value = getValue();
    return (
      <span className={clsx('label', `label-${nodeStatusBadge(value)}`)}>
        {value}
      </span>
    );
  },
});
