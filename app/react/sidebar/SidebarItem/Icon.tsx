import clsx from 'clsx';

import styles from './Icon.module.css';

interface Props {
  iconClass: string;
}

export function Icon({ iconClass }: Props) {
  return (
    <i
      role="img"
      className={clsx('fa', iconClass, styles.menuIcon)}
      aria-label="itemIcon"
      aria-hidden="true"
    />
  );
}
