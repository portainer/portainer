import { MouseEventHandler, PropsWithChildren } from 'react';
import { UISref, UISrefProps } from '@uirouter/react';

interface Props {
  title?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function Link({
  title = '',
  children,
  onClick,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <UISref {...props}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid,jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <a
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick(e);
          }
        }}
      >
        {children}
      </a>
    </UISref>
  );
}
