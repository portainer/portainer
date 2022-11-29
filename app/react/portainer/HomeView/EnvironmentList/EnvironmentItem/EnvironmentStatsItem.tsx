import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  value: string | number;
  icon: IconProps['icon'];
  iconClass?: string;
}

export function EnvironmentStatsItem({
  value,
  icon,
  children,
  iconClass,
}: PropsWithChildren<Props>) {
  return (
    <span className="vertical-center space-right">
      <Icon
        className={clsx('icon icon-sm space-right', iconClass)}
        icon={icon}
      />
      <span>{value}</span>
      {children && <span className="space-left">{children}</span>}
    </span>
  );
}
