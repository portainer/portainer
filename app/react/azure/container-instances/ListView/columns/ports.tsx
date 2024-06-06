import { ExternalLink } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import { ContainerGroup } from '@/react/azure/types';
import { getPorts } from '@/react/azure/utils';
import { getSchemeFromPort } from '@/react/common/network-utils';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const ports = columnHelper.accessor(getPorts, {
  header: 'Published Ports',
  cell: PortsCell,
  id: 'ports',
});

function PortsCell({
  getValue,
  row: { original: container },
}: CellContext<ContainerGroup, ReturnType<typeof getPorts>>) {
  const ports = getValue();

  const ip = container.properties.ipAddress
    ? container.properties.ipAddress.ip
    : '';
  if (ports.length === 0 || !ip) {
    return '-';
  }

  return ports.map((port) => {
    const scheme = getSchemeFromPort(port.host);
    return (
      <a
        className="image-tag"
        href={`${scheme}://${ip}:${port.host}`}
        key={port.host}
      >
        <Icon icon={ExternalLink} className="mr-1" />
        {ip}:{port.host}
      </a>
    );
  });
}
