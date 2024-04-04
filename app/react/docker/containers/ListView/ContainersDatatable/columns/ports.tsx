import _ from 'lodash';
import { ExternalLink } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import type { DockerContainer } from '@/react/docker/containers/types';
import { getSchemeFromPort } from '@/react/common/network-utils';

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

  const publicURL = getPublicUrl(environment.PublicURL);

  return _.uniqBy(ports, 'public').map((port) => {
    let url = publicURL || port.host || '';
    if (!url.startsWith('http')) {
      const scheme = getSchemeFromPort(port.private);
      url = `${scheme}://${url}`;
    }
    url = `${url}:${port.public}`;

    return (
      <a
        key={`${port.host}:${port.public}`}
        className="image-tag"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        <Icon icon={ExternalLink} />
        {port.public}:{port.private}
      </a>
    );
  });
}

function getPublicUrl(url?: string): string {
  if (!url) {
    return '';
  }

  // Add protocol if missing
  const u =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `http://${url}`;

  try {
    const parsedUrl = new URL(u);
    return `${parsedUrl.protocol}://${parsedUrl.hostname}`;
  } catch (error) {
    return '';
  }
}
