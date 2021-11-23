import { PropsWithChildren } from 'react';

import styles from './Code.module.css';

export function Code({ children }: PropsWithChildren<unknown>) {
  return <code className={styles.code}>{children}</code>;
}
