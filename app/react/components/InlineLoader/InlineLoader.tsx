import { Loader2 } from 'lucide-react';
import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

type Size = 'xs' | 'sm' | 'md';

export type Props = {
  className?: string;
  size?: Size;
};

const sizeStyles: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
};

export function InlineLoader({
  children,
  className,
  size = 'sm',
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        'text-muted flex items-center gap-2',
        className,
        sizeStyles[size]
      )}
    >
      <Icon icon={Loader2} className="animate-spin-slow" />
      {children}
    </div>
  );
}
