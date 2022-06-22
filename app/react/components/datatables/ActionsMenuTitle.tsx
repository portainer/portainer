import { ReactNode } from 'react';

import styles from './ActionsMenuTitle.module.css';

interface Props {
  children: ReactNode;
}

export function ActionsMenuTitle({ children }: Props) {
  return <div className={styles.tableActionsTitle}>{children}</div>;
}
