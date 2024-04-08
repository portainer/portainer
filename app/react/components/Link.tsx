import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISrefProps, useSref } from '@uirouter/react';

interface Props {
  title?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
  'data-cy': AnchorHTMLAttributes<HTMLAnchorElement>['data-cy'];
}

export function Link({
  children,
  'data-cy': dataCy,
  to,
  params,
  options,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  const { onClick, href } = useSref(to, params, options);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a onClick={onClick} href={href} data-cy={dataCy} {...props}>
      {children}
    </a>
  );
}
