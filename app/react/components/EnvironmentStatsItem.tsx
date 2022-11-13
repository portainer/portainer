import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  value: string | number;
  icon: string;
  iconClass?: string;
}

export function EnvironmentStatsItem({
  value,
  icon,
  children,
  featherIcon,
  iconClass,
}: PropsWithChildren<Props>) {
  return (
    <span className="flex gap-1 items-center">
      <Icon
        className={clsx('icon icon-sm', iconClass)}
        icon={icon}
        feather={featherIcon}
      />
      <span>{value}</span>
      {children && (
        <span className="ml-1 flex gap-2 items-center">{children}</span>
      )}
    </span>
  );
}
