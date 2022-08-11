import { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

import { useTableContext } from './TableContainer';

interface Props {
  icon?: ReactNode | ComponentType<unknown>;
  featherIcon?: boolean;
  label: string;
}

export function TableTitle({
  icon,
  featherIcon,
  label,
  children,
}: PropsWithChildren<Props>) {
  useTableContext();

  return (
    <div className="toolBar">
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
  );
}
