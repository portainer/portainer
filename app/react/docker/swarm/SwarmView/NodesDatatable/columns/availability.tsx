import clsx from 'clsx';

import { NodeViewModel } from '@/docker/models/node';

import { columnHelper } from './column-helper';

export const availability = columnHelper.accessor('Availability', {
  header: 'Availability',
  cell({ getValue }) {
    const value = getValue();
    return (
      <span className={clsx('label', `label-${badgeClass(value)}`)}>
        {value}
      </span>
    );
  },
});

export function badgeClass(text: NodeViewModel['Availability']) {
  if (text === 'pause') {
    return 'warning';
  }

  if (text === 'drain') {
    return 'danger';
  }

  return 'success';
}
