import { PropsWithChildren, AriaAttributes } from 'react';
import clsx from 'clsx';

import styles from './SidebarItem.module.css';

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
      className={clsx(styles.sidebarMenuItem, className)}
      title={label}
      aria-label={label}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
    >
      {children}
    </li>
  );
}
