import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  className?: string;
}

export function FormError({ children, className }: PropsWithChildren<Props>) {
  return (
    <p
      className={clsx(`text-muted small vertical-center help-block`, className)}
    >
      <Icon icon={AlertTriangle} className="icon-warning" />
      <span className="text-warning">{children}</span>
    </p>
  );
}
