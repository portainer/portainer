import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@/react/components/Icon';

import { useWidgetContext } from './Widget';

interface Props {
  title: ReactNode;
  icon: ReactNode;
  featherIcon?: boolean;
  className?: string;
}

export function WidgetTitle({
  title,
  icon,
  className,
  children,
  featherIcon,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className="widget-header">
      <div className="row">
        <span className={clsx('pull-left vertical-center', className)}>
          <div className="widget-icon">
            <Icon
              icon={icon}
              feather={featherIcon}
              className="space-right feather"
            />
          </div>
          <span>{title}</span>
        </span>
        <span className={clsx('pull-right', className)}>{children}</span>
      </div>
    </div>
  );
}
