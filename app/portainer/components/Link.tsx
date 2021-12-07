import { ReactNode } from 'react';
import { UISref, UISrefProps } from '@uirouter/react';

export function Link({
  children,
  ...props
}: { children: ReactNode } & UISrefProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <UISref {...props}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a>{children}</a>
    </UISref>
  );
}
