import { PropsWithChildren, AnchorHTMLAttributes } from 'react';
import { UISref, UISrefProps } from '@uirouter/react';

interface Props {
  title?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
}

export function Link({
  title = '',
  children,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <UISref {...props}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a title={title} target={props.target}>
        {children}
      </a>
    </UISref>
  );
}
