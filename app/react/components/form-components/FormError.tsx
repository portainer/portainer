import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

interface Props {
  className?: string;
}

export function FormError({ children, className }: PropsWithChildren<Props>) {
  return (
    <p className={clsx(`text-muted small vertical-center`, className)}>
      <Icon icon="alert-triangle" className="icon-warning" feather />
      <span className="text-warning">{children}</span>
    </p>
  );
}
