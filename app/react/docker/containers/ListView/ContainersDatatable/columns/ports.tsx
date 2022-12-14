import { Column } from 'react-table';
import _ from 'lodash';
import { ExternalLink } from 'lucide-react';

import type { DockerContainer, Port } from '@/react/docker/containers/types';

import { Icon } from '@@/Icon';

import { useRowContext } from '../RowContext';

export const ports: Column<DockerContainer> = {
  Header: 'Published Ports',
  accessor: 'Ports',
  id: 'ports',
  Cell: PortsCell,
  disableSortBy: true,
  disableFilters: true,
  canHide: true,
  Filter: () => null,
};

interface Props {
  value: Port[];
}

function PortsCell({ value: ports }: Props) {
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
