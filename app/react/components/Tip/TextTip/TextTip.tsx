import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Icon } from '@@/Icon';

type Color = 'orange' | 'blue';

export interface Props {
  color?: Color;
}

export function TextTip({
  color = 'orange',
  children,
}: PropsWithChildren<Props>) {
  let iconClass: string;

  switch (color) {
    case 'blue':
      iconClass = 'icon-primary';
      break;
    case 'orange':
      iconClass = 'icon-warning';
      break;
    default:
      iconClass = 'icon-warning';
  }

  return (
    <p className="small vertical-center">
      <i className="icon-container">
        <Icon
          icon="alert-circle"
          feather
          className={clsx(`${iconClass}`, 'space-right')}
        />
      </i>
      <span className="text-muted">{children}</span>
    </p>
  );
}
