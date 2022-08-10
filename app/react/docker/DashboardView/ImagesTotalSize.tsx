import clsx from 'clsx';

import { Icon } from '@/react/components/Icon';
import { humanize } from '@/portainer/filters/filters';

interface Props {
  imagesTotalSize: number;
}

export function useImagesTotalSizeComponent(imagesTotalSize: number) {
  return <ImagesTotalSize imagesTotalSize={imagesTotalSize} />;
}

export function ImagesTotalSize({ imagesTotalSize }: Props) {
  return (
    <div className="vertical-center">
      <Icon icon="pie-chart" className={clsx('space-right')} feather />
      {humanize(imagesTotalSize)}
    </div>
  );
}
