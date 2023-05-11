import _ from 'lodash';
import { ExternalLink } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import type { DockerContainer } from '@/react/docker/containers/types';

import { Icon } from '@@/Icon';

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

function Cell({ row }: CellContext<DockerContainer, string>) {
  const ports = row.original.Ports;

  const { environment } = useRowContext();

  if (ports.length === 0) {
    return '-';
  }

  const { PublicURL: publicUrl } = environment;

  return _.uniqBy(ports, 'public').map((port) => (
    <a
      key={`${port.host}:${port.public}`}
      className="image-tag"
      href={`http://${publicUrl || port.host}:${port.public}`}
      target="_blank"
      rel="noreferrer"
    >
      <Icon icon={ExternalLink} />
      {port.public}:{port.private}
    </a>
  ));
}
