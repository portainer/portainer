import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  value: string | number;
  icon: string;
  iconClass?: string;
}

export function Stat({
  value,
  icon,
  children,
  featherIcon,
  iconClass,
}: PropsWithChildren<Props>) {
  return (
    <span className="vertical-center space-right">
      <Icon
        className={clsx('icon icon-sm space-right', iconClass)}
        icon={icon}
        feather={featherIcon}
      />
      <span>{value}</span>
      {children && <span className="space-left">{children}</span>}
    </span>
  );
}
