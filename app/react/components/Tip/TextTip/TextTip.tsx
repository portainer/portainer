import { PropsWithChildren } from 'react';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

import { Icon, IconMode } from '@@/Icon';

type Color = 'orange' | 'blue' | 'red' | 'green';

export interface Props {
  icon?: React.ReactNode;
  color?: Color;
  className?: string;
  childrenWrapperClassName?: string;
  inline?: boolean;
}

export function TextTip({
  color = 'orange',
  icon = AlertCircle,
  inline = true,
  className,
  children,
  childrenWrapperClassName = 'text-muted',
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        className,
        'small gap-1 align-top text-xs',
        inline ? 'inline-flex' : 'flex'
      )}
    >
      <Icon icon={icon} mode={getMode(color)} className="!mt-0.5 flex-none" />

      <span className={childrenWrapperClassName}>{children}</span>
    </div>
  );
}

function getMode(color: Color): IconMode {
  switch (color) {
    case 'blue':
      return 'primary';
    case 'red':
      return 'danger';
    case 'green':
      return 'success';
    case 'orange':
    default:
      return 'warning';
  }
}
