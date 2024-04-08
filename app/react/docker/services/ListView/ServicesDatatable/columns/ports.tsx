import { ExternalLink } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import { ServiceViewModel } from '@/docker/models/service';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { getSchemeFromPort } from '@/react/common/network-utils';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const ports = columnHelper.accessor(
  (row) =>
    (row.Ports || [])
      .filter((port) => port.PublishedPort)
      .map((port) => `${port.PublishedPort}:${port.TargetPort}`)
      .join(','),
  {
    header: 'Published Ports',
    id: 'ports',
    cell: Cell,
  }
);

function Cell({
  row: { original: item },
}: CellContext<ServiceViewModel, string>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  const ports = item.Ports || [];

  if (ports.length === 0) {
    return '-';
  }

  const { PublicURL: publicUrl } = environmentQuery.data;

  return ports
    .filter((port) => port.PublishedPort)
    .map((port) => {
      const scheme = getSchemeFromPort(port.TargetPort);

      return (
        <a
          key={`${publicUrl}:${port.PublishedPort}`}
          className="image-tag vertical-center"
          href={`${scheme}://${publicUrl}:${port.PublishedPort}`}
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon={ExternalLink} />
          {port.PublishedPort}:{port.TargetPort}
        </a>
      );
    });
}
