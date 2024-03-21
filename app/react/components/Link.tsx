import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISref, UISrefProps } from '@uirouter/react';

interface Props {
  title?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
  'data-cy': AnchorHTMLAttributes<HTMLAnchorElement>['data-cy'];
}

export function Link({
  title = '',
  className,
  children,
  'data-cy': dataCy,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <UISref className={className} {...props}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a title={title} target={props.target} rel={props.rel} data-cy={dataCy}>
        {children}
      </a>
    </UISref>
  );
}
