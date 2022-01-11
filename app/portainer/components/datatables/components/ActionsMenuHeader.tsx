import { ReactNode } from 'react';

import styles from './ActionsMenu.module.css';

interface Props {
  children: ReactNode;
}

export function ActionsMenuHeader({ children }: Props) {
  return <div className={styles.tableActionsHeader}>{children}</div>;
}
