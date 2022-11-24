import { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

interface Props {
  icon?: ReactNode | ComponentType<unknown>;
  featherIcon?: boolean;
  label: string;
  description?: ReactNode;
}

export function TableTitle({
  icon,
  featherIcon,
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
              <Icon
                icon={icon}
                feather={featherIcon}
                className="space-right feather"
              />
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
