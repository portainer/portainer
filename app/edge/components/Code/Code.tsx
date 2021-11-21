import { PropsWithChildren } from 'react';

import styles from './Code.module.css';

export interface Props {
  text?: string;
}

export function Code({ text = '', children }: PropsWithChildren<Props>) {
  return <code className={styles.code}>{text || children}</code>;
}
