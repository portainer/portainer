import { CellContext } from '@tanstack/react-table';
import { useSref } from '@uirouter/react';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import i18n from '@/i18n';

import { columnHelper } from './helper';

export const image = columnHelper.accessor('Image', {
  header: i18n.t('common.image') as string,
  id: 'image',
  cell: ImageCell,
});

function ImageCell({ getValue }: CellContext<ContainerListViewModel, string>) {
  const imageName = getValue();
  const linkProps = useSref('docker.images.image', { id: imageName });
  const shortImageName = trimSHASum(imageName);

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
