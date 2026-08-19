import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISrefProps, useSref } from '@uirouter/react';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  'data-cy': string;
}

export function Link({
  children,
  'data-cy': dataCy,
  to,
  params,
  options,
  title,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  const { onClick, href } = useSref(to, params, options);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a onClick={onClick} href={href} data-cy={dataCy} title={title} {...props}>
      {children}
    </a>
  );
}
