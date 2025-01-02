import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  className?: string;
}

export function FormError({ children, className }: PropsWithChildren<Props>) {
  if (!children) {
    return null;
  }

  return (
    <div
      className={clsx(
        `text-muted help-block !inline-flex gap-1 !align-top text-xs`,
        className
      )}
    >
      <Icon
        icon={AlertTriangle}
        mode="warning"
        size="sm"
        className="flex-none"
      />
      <div className="text-warning">{children}</div>
    </div>
  );
}
