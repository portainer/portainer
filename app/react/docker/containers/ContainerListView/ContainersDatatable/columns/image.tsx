import { CellProps, Column } from 'react-table';
import { useSref } from '@uirouter/react';

import type { DockerContainer } from '@/react/docker/containers/types';
import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';

export const image: Column<DockerContainer> = {
  Header: 'Image',
  accessor: 'Image',
  id: 'image',
  disableFilters: true,
  Cell: ImageCell,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

function ImageCell({
  value: image,
  row: { original: container },
}: CellProps<DockerContainer>) {
  const imageName = image
  const linkProps = useSref('docker.images.image', { id: imageName });
  const shortImageName = trimSHASum(imageName);

  if (container.EnvironmentStatus !== 1) {
    return <span>{shortImageName}</span>;
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick}>
      {shortImageName}
    </a>
  );

  function trimSHASum(imageName: string) {
    if (!imageName) {
      return '';
    }

    if (imageName.indexOf('sha256:') === 0) {
      return imageName.substring(7, 19);
    }

    return imageName.split('@sha256')[0];
  }
}
