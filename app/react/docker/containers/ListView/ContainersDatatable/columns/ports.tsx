import _ from 'lodash';
import { ExternalLink } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import type { DockerContainer, Port } from '@/react/docker/containers/types';

import { Icon } from '@@/Icon';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const ports = columnHelper.accessor('Ports', {
  header: 'Published Ports',
  id: 'ports',
  cell: PortsCell,
});

function PortsCell({ getValue }: CellContext<DockerContainer, Port[]>) {
  const ports = getValue();

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
