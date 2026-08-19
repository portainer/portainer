import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { WidgetIcon } from './WidgetIcon';
import { useWidgetContext } from './Widget';

interface Props {
  title: ReactNode;
  icon?: ReactNode;
  className?: string;
  subtitle?: string;
}

export function WidgetTitle({
  title,
  icon,
  className,
  children,
  subtitle,
}: PropsWithChildren<Props>) {
  const { titleId } = useWidgetContext();

  return (
    <div className="widget-header">
      <div className="flex items-center justify-between">
        <span className={clsx('inline-flex items-center gap-1', className)}>
          {icon && <WidgetIcon icon={icon} />}
          <h2 id={titleId} className={clsx('m-0 text-base', icon && 'ml-1')}>
            {title}
          </h2>
        </span>
        <span className={clsx('flex items-center', className)}>{children}</span>
      </div>
      {subtitle && <span className="text-muted small">{subtitle}</span>}
    </div>
  );
}
