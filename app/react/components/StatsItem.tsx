import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  value: string | number;
  icon: IconProps['icon'];
  iconClass?: string;
}

export function StatsItem({
  value,
  icon,
  children,
  iconClass,
}: PropsWithChildren<Props>) {
  return (
    <span className="flex gap-1 items-center">
      <Icon className={clsx('icon icon-sm', iconClass)} icon={icon} />
      <span>{value}</span>
      {children && (
        <span className="ml-1 flex gap-2 items-center">{children}</span>
      )}
    </span>
  );
}
