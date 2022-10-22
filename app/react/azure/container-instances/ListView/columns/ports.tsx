import { CellProps, Column } from 'react-table';

import { ContainerGroup } from '@/react/azure/types';
import { getPorts } from '@/react/azure/utils';

import { Icon } from '@@/Icon';

export const ports: Column<ContainerGroup> = {
  Header: 'Published Ports',
  accessor: (container) => getPorts(container),
  id: 'ports',
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  Cell: PortsCell,
};

function PortsCell({
  value: ports,
  row: { original: container },
}: CellProps<ContainerGroup, ReturnType<typeof getPorts>>) {
  const ip = container.properties.ipAddress
    ? container.properties.ipAddress.ip
    : '';
  if (ports.length === 0 || !ip) {
    return '-';
  }

  return ports.map((port) => (
    <a className="image-tag" href={`http://${ip}:${port.host}`} key={port.host}>
      <Icon icon="external-link" className="mr-1" />
      {ip}:{port.host}
    </a>
  ));
}
