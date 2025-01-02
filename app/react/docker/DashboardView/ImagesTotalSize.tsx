import clsx from 'clsx';
import { PieChart } from 'lucide-react';

import { Icon } from '@/react/components/Icon';
import { humanize } from '@/portainer/filters/filters';

interface Props {
  imagesTotalSize: number;
}

export function ImagesTotalSize({ imagesTotalSize }: Props) {
  return (
    <div className="vertical-center">
      <Icon icon={PieChart} className={clsx('space-right')} />
      {humanize(imagesTotalSize)}
    </div>
  );
}
