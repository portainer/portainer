import _ from 'lodash';
import { CellContext } from '@tanstack/react-table';

import { PublishedPortLink } from '@/react/docker/components/ImageStatus/PublishedPortLink';
import type { ContainerListViewModel } from '@/react/docker/containers/types';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const ports = columnHelper.accessor(
  (row) =>
    _.uniqBy(row.Ports, 'public')
      .map((port) => `${port.public}:${port.private}`)
      .join(','),
  {
    header: 'Published Ports',
    id: 'ports',
    cell: Cell,
  }
);

function Cell({ row }: CellContext<ContainerListViewModel, string>) {
  const ports = row.original.Ports;

  const { environment } = useRowContext();

  if (ports.length === 0) {
    return '-';
  }

  return _.uniqBy(ports, 'public').map((port) => (
    <PublishedPortLink
      key={`${port.host}:${port.public}`}
      hostPort={port.public}
      containerPort={port.private}
      hostURL={environment.PublicURL || port.host}
    />
  ));
}
