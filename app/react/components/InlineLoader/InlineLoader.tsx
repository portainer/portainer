import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

type Size = 'xs' | 'sm' | 'md';

export type Props = {
  children: ReactNode;
  className?: string;
  size?: Size;
};

const sizeStyles: Record<Size, string> = {
  xs: 'text-xs gap-1',
  sm: 'text-sm gap-2',
  md: 'text-md gap-2',
};

export function InlineLoader({ children, className, size = 'sm' }: Props) {
  return (
    <div
      className={clsx(
        'text-muted flex items-center',
        className,
        sizeStyles[size]
      )}
    >
      <Icon icon={Loader2} className="flex-none animate-spin-slow" />
      {children}
    </div>
  );
}
