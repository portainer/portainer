import { ArrowUpRight } from 'lucide-react';
import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

interface Props {
  to: string;
  className?: string;
  showIcon?: boolean;
}

export function ExternalLink({
  to,
  className,
  children,
  showIcon = true,
  'data-cy': dataCy,
}: PropsWithChildren<Props & AutomationTestingProps>) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noreferrer"
      data-cy={dataCy}
      className={clsx('inline-flex align-baseline', className)}
    >
      {children}
      {showIcon && <ArrowUpRight className="align-top" />}
    </a>
  );
}
