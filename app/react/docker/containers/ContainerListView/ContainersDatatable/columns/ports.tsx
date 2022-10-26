import { CellProps, Column } from 'react-table';
import _ from 'lodash';

import type { DockerContainer } from '@/react/docker/containers/types';

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

function PortsCell({
  row: { original: container },
}: CellProps<DockerContainer>) {
  const ports = container.Ports;

  if (ports.length === 0) {
    return '-';
  }

  const publicUrl = container.PublicURL;

  return _.uniqBy(ports, 'public').map((port) => (
    <a
      key={`${port.host}:${port.public}`}
      className="image-tag"
      href={`http://${publicUrl || port.host}:${port.public}`}
      target="_blank"
      rel="noreferrer"
    >
      <i className="fa fa-external-link-alt" aria-hidden="true" />
      {port.public}:{port.private}
    </a>
  ));
}
