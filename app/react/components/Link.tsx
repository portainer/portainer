import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISrefProps, useSref } from '@uirouter/react';

interface Props {
  title?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
}

export function Link({
  children,
  to,
  params,
  options,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  const { onClick, href } = useSref(to, params, options);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a onClick={onClick} href={href} {...props}>
      {children}
    </a>
  );
}
