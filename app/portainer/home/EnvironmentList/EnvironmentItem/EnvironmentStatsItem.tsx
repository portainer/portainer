import clsx from 'clsx';
import { PropsWithChildren } from 'react';

interface Props {
  value: string | number;
  icon: string;
}

export function Stat({ value, icon, children }: PropsWithChildren<Props>) {
  return (
    <span>
      <i className={clsx('fa  space-right', icon)} aria-hidden="true" />
      <span>{value}</span>
      {children && <span className="space-left">{children}</span>}
    </span>
  );
}
