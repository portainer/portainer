import { PropsWithChildren } from 'react';

import styles from './InnerDatatable.module.css';

export function InnerDatatable({ children }: PropsWithChildren<unknown>) {
  return <div className={styles.innerDatatable}>{children}</div>;
}
