import { PropsWithChildren } from 'react';
import clsx from 'clsx';

type Color = 'orange' | 'blue';

export interface Props {
  color?: Color;
}

export function TextTip({
  color = 'orange',
  children,
}: PropsWithChildren<Props>) {
  return (
    <p className="text-muted small">
      <i
        aria-hidden="true"
        className={clsx(
          'fa fa-exclamation-circle',
          `${color}-icon`,
          'space-right'
        )}
      />
      {children}
    </p>
  );
}
