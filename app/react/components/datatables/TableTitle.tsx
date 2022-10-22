import { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

interface Props {
  icon?: ReactNode | ComponentType<unknown>;
  label: string;
  description?: JSX.Element;
}

export function TableTitle({
  icon,
  label,
  children,
  description,
}: PropsWithChildren<Props>) {
  return (
    <div className="toolBar flex-col">
      <div className="flex gap-1 p-0 w-full items-center">
        <div className="toolBarTitle">
          {icon && (
            <div className="widget-icon">
              <Icon icon={icon} className="space-right feather" />
            </div>
          )}

          {label}
        </div>
        {children}
      </div>
      {description && description}
    </div>
  );
}
