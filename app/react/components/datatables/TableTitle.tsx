import { PropsWithChildren } from 'react';

import { Icon, IconProps } from '@@/Icon';

import { useTableContext } from './TableContainer';

interface Props extends IconProps {
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
        <Icon
          icon={icon}
          feather={featherIcon}
          className="icon-nested-blue icon-primary space-right"
        />

        {label}
      </div>
      {children}
    </div>
  );
}
