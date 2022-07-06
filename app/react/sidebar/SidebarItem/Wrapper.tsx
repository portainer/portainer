import { PropsWithChildren, AriaAttributes } from 'react';
import clsx from 'clsx';

interface Props {
  className?: string;
  label?: string;
}

export function Wrapper({
  className,
  children,
  label,
  ...ariaProps
}: PropsWithChildren<Props> & AriaAttributes) {
  return (
    <li
      className={clsx(
        'flex',
        className,
        'text-gray-3 min-h-8 [&>a]:text-inherit [&>a]:hover:text-inherit [&>a]:hover:no-underline'
      )}
      aria-label={label}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
    >
      {children}
    </li>
  );
}
