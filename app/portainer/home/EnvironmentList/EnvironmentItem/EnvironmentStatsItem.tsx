import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  value: string | number;
  icon: string;
}

export function Stat({
  value,
  icon,
  children,
  featherIcon,
}: PropsWithChildren<Props>) {
  return (
    <span>
      <Icon className="space-right" icon={icon} feather={featherIcon} />
      <span>{value}</span>
      {children && <span className="space-left">{children}</span>}
    </span>
  );
}
