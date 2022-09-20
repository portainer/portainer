import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISref, UISrefProps } from '@uirouter/react';
import clsx from 'clsx';

interface Props {
  title?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
}

export function Link({
  title = '',
  className,
  children,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <UISref className={clsx('no-decoration', className)} {...props}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a title={title} target={props.target}>
        {children}
      </a>
    </UISref>
  );
}
