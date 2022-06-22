import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

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
        <span className={clsx('pull-left', className)}>
          {typeof icon === 'string' ? <i className={clsx('fa', icon)} /> : icon}
          <span>{title}</span>
        </span>
        <span className={clsx('pull-right', className)}>{children}</span>
      </div>
    </div>
  );
}
