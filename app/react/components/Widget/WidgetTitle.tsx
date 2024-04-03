import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@/react/components/Icon';

import { useWidgetContext } from './Widget';

interface Props {
  title: ReactNode;
  icon: ReactNode;
  className?: string;
}

export function WidgetTitle({
  title,
  icon,
  className,
  children,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className="widget-header">
      <div className="row">
        <span className={clsx('pull-left vertical-center', className)}>
          <div className="widget-icon">
            <Icon icon={icon} className="space-right" />
          </div>
          <h2 className="text-base m-0">{title}</h2>
        </span>
        <span className={clsx('pull-right', className)}>{children}</span>
      </div>
    </div>
  );
}
