import { Loader2 } from 'lucide-react';
import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

export type Props = {
  className: string;
};

export function InlineLoader({
  children,
  className,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx('text-muted flex items-center gap-2 text-sm', className)}
    >
      <Icon icon={Loader2} className="animate-spin-slow" />
      {children}
    </div>
  );
}
