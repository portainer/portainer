import { ComponentType, PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

interface Props {
  icon?: ReactNode | ComponentType<unknown>;
  label: string;
  description?: ReactNode;
  className?: string;
}

export function TableTitle({
  icon,
  label,
  children,
  description,
  className,
}: PropsWithChildren<Props>) {
  return (
    <div className={clsx('toolBar flex-col', className)}>
      <div className="flex gap-1 p-0 w-full items-center">
        <div className="toolBarTitle">
          {icon && (
            <div className="widget-icon">
              <Icon icon={icon} className="space-right" />
            </div>
          )}

          {label}
        </div>
        {children}
      </div>
      {description}
    </div>
  );
}
